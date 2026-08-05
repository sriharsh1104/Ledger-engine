import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatbotApiError, canUseChatbot } from '../api/chatbotClient'
import type { ChatbotUsage, ChatMode, UiChatMessage } from '../api/chatbot.types'
import { CHAT_MODES, chatbotService } from '../services/chatbot.service'

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function formatChatError(err: unknown): string {
  if (err instanceof ChatbotApiError) {
    if (err.code === 'CHATBOT_DAILY_LIMIT' || err.status === 429) {
      return 'Daily AI query limit reached. Try again tomorrow.'
    }
    if (err.code === 'CHATBOT_CONVERSATION_FORBIDDEN' || err.status === 403) {
      return 'You do not have access to this conversation.'
    }
    if (err.code === 'CHATBOT_NOT_CONFIGURED' || err.status === 503) {
      return 'AI assistant is temporarily unavailable.'
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Failed to send message'
}

export function useChatbot() {
  const [messages, setMessages] = useState<UiChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [mode, setMode] = useState<ChatMode | string>('general')
  const [modes, setModes] = useState(CHAT_MODES)
  const [conversations, setConversations] = useState<
    Awaited<ReturnType<typeof chatbotService.listConversations>>
  >([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<ChatbotUsage | null>(null)
  const [meta, setMeta] = useState<{
    model_used?: string
    calls_remaining_today?: number
  }>({})
  const [ready, setReady] = useState(() => canUseChatbot())
  const abortRef = useRef<AbortController | null>(null)

  const refreshAuthState = useCallback(() => {
    setReady(canUseChatbot())
  }, [])

  useEffect(() => {
    chatbotService.listModes().then(setModes).catch(() => setModes(CHAT_MODES))
  }, [])

  const refreshUsage = useCallback(async () => {
    if (!canUseChatbot()) {
      setUsage(null)
      return
    }
    try {
      const next = await chatbotService.usage()
      setUsage(next)
      setMeta((prev) => ({
        ...prev,
        calls_remaining_today: next.callsRemainingToday,
      }))
    } catch {
      // usage is optional for UI
    }
  }, [])

  const refreshConversations = useCallback(async () => {
    if (!canUseChatbot()) return
    setLoadingConversations(true)
    try {
      const list = await chatbotService.listConversations()
      setConversations(list)
    } catch {
      // history is optional — don't block chat
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) {
      setUsage(null)
      setConversations([])
      return
    }
    void refreshUsage()
    void refreshConversations()
  }, [ready, refreshConversations, refreshUsage])

  const resetChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setError(null)
    setMeta((prev) => ({
      calls_remaining_today: prev.calls_remaining_today ?? usage?.callsRemainingToday,
    }))
  }, [usage?.callsRemainingToday])

  const loadConversation = useCallback(async (id: string) => {
    setError(null)
    setSending(true)
    try {
      const detail = await chatbotService.getConversation(id)
      setConversationId(detail.id)
      if (detail.mode) setMode(detail.mode)
      setMessages(
        detail.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            id: newId(),
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
      )
    } catch (err) {
      setError(formatChatError(err) || 'Failed to load conversation')
    } finally {
      setSending(false)
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return

      setError(null)
      setSending(true)

      const userMsg: UiChatMessage = { id: newId(), role: 'user', content: trimmed }
      const assistantId = newId()
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: 'assistant', content: '', pending: true },
      ])

      const body = {
        message: trimmed,
        mode,
        conversation_id: conversationId,
        max_tokens: 1000,
      }

      const controller = new AbortController()
      abortRef.current = controller

      try {
        let streamed = ''
        let streamMeta: Awaited<ReturnType<typeof chatbotService.chatStream>> = {}

        try {
          streamMeta = await chatbotService.chatStream(body, {
            signal: controller.signal,
            onToken: (token) => {
              streamed += token
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: streamed, pending: true } : m,
                ),
              )
            },
            onMeta: (m) => {
              streamMeta = { ...streamMeta, ...m }
            },
          })
        } catch (streamErr) {
          if (controller.signal.aborted) throw streamErr
          // Fall back to non-streaming /chat
          const res = await chatbotService.chat(body)
          streamed = res.response
          streamMeta = res
        }

        if (!streamed && typeof streamMeta.response === 'string') {
          streamed = streamMeta.response
        }

        if (streamMeta.conversation_id) {
          setConversationId(streamMeta.conversation_id)
        }

        const remaining = streamMeta.calls_remaining_today
        setMeta({
          model_used: streamMeta.model_used,
          calls_remaining_today: remaining,
        })
        if (typeof remaining === 'number' && usage) {
          setUsage({
            ...usage,
            usedToday: Math.max(0, usage.dailyLimit - remaining),
            callsRemainingToday: remaining,
          })
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: streamed || 'No response received.',
                  pending: false,
                  meta: {
                    model_used: streamMeta.model_used,
                    tokens: streamMeta.tokens,
                    cost_usd: streamMeta.cost_usd,
                    calls_remaining_today: streamMeta.calls_remaining_today,
                  },
                }
              : m,
          ),
        )

        void refreshConversations()
        void refreshUsage()
      } catch (err) {
        if (controller.signal.aborted) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content || 'Cancelled.', pending: false }
                : m,
            ),
          )
        } else {
          const message = formatChatError(err)
          setError(message)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: message,
                    pending: false,
                    error: true,
                  }
                : m,
            ),
          )
          if (err instanceof ChatbotApiError && err.code === 'CHATBOT_DAILY_LIMIT') {
            void refreshUsage()
          }
        }
      } finally {
        abortRef.current = null
        setSending(false)
      }
    },
    [conversationId, mode, refreshConversations, refreshUsage, sending, usage],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return {
    messages,
    conversationId,
    mode,
    setMode,
    modes,
    conversations,
    loadingConversations,
    sending,
    error,
    meta,
    usage,
    /** Logged in → can use chatbot via gateway JWT. */
    canChat: ready,
    refreshAuthState,
    refreshConversations,
    refreshUsage,
    resetChat,
    loadConversation,
    sendMessage,
    stop,
  }
}
