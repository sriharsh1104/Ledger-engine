import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatbotApiError, getChatbotApiKey } from '../api/chatbotClient'
import type { ChatMode, UiChatMessage } from '../api/chatbot.types'
import { CHAT_MODES, chatbotService } from '../services/chatbot.service'

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
  const [meta, setMeta] = useState<{
    model_used?: string
    calls_remaining_today?: number
  }>({})
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(getChatbotApiKey()))
  const abortRef = useRef<AbortController | null>(null)

  const refreshKeyState = useCallback(() => {
    setHasApiKey(Boolean(getChatbotApiKey()))
  }, [])

  useEffect(() => {
    chatbotService.listModes().then(setModes).catch(() => setModes(CHAT_MODES))
  }, [])

  const refreshConversations = useCallback(async () => {
    if (!getChatbotApiKey()) return
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
    if (hasApiKey) void refreshConversations()
  }, [hasApiKey, refreshConversations])

  const resetChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setError(null)
    setMeta({})
  }, [])

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
      setError(err instanceof Error ? err.message : 'Failed to load conversation')
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

        setMeta({
          model_used: streamMeta.model_used,
          calls_remaining_today: streamMeta.calls_remaining_today,
        })

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
          const message =
            err instanceof ChatbotApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Failed to send message'
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
        }
      } finally {
        abortRef.current = null
        setSending(false)
      }
    },
    [conversationId, mode, refreshConversations, sending],
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
    hasApiKey,
    refreshKeyState,
    refreshConversations,
    resetChat,
    loadConversation,
    sendMessage,
    stop,
  }
}
