import axios from 'axios'
import { apiClient } from '../api/client'
import { chatbotFetch, ChatbotApiError } from '../api/chatbotClient'
import type { ApiResponse } from '../api/types'
import type {
  ChatbotMe,
  ChatbotUsage,
  ChatConversationDetail,
  ChatConversationSummary,
  ChatMode,
  ChatModesResponse,
  ChatRequest,
  ChatResponse,
} from '../api/chatbot.types'

const CHATBOT = '/chatbot'

export const CHAT_MODES: { id: ChatMode; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'ruby', label: 'Ruby / Rails' },
  { id: 'python', label: 'Python' },
  { id: 'sql', label: 'SQL' },
  { id: 'code-review', label: 'Code Review' },
]

function toChatbotError(error: unknown): ChatbotApiError {
  if (error instanceof ChatbotApiError) return error
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; code?: string }
      | undefined
    return new ChatbotApiError(
      data?.message ?? error.message ?? 'Chatbot request failed',
      error.response?.status ?? 500,
      data?.code,
    )
  }
  if (error instanceof Error) {
    return new ChatbotApiError(error.message, 500)
  }
  return new ChatbotApiError('Chatbot request failed', 500)
}

function normalizeModes(payload: ChatModesResponse | string): { id: string; label: string }[] {
  if (typeof payload === 'string') {
    return parseModesText(payload)
  }
  const raw = payload.modes
  if (typeof raw === 'string') {
    return parseModesText(raw)
  }
  if (Array.isArray(raw)) {
    return raw.map((m) =>
      typeof m === 'string'
        ? { id: m, label: m }
        : { id: m.id, label: m.label ?? m.id },
    )
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([id, label]) => ({ id, label: String(label) }))
  }
  return CHAT_MODES
}

function parseModesText(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const parsed = lines
    .map((line) => {
      const match = line.match(/^(\S+)\s+(.+)$/)
      if (!match) return null
      return { id: match[1], label: match[2].trim() }
    })
    .filter((m): m is { id: string; label: string } => Boolean(m))
  return parsed.length > 0 ? parsed : CHAT_MODES
}

function asConversationList(data: unknown): ChatConversationSummary[] {
  if (Array.isArray(data)) return data as ChatConversationSummary[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.conversations)) return obj.conversations as ChatConversationSummary[]
    if (Array.isArray(obj.items)) return obj.items as ChatConversationSummary[]
    if (Array.isArray(obj.data)) return obj.data as ChatConversationSummary[]
  }
  return []
}

function asConversationDetail(data: unknown, id: string): ChatConversationDetail {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const messages = (obj.messages ?? obj.history ?? []) as ChatConversationDetail['messages']
    return {
      id: String(obj.id ?? id),
      mode: typeof obj.mode === 'string' ? obj.mode : undefined,
      messages: Array.isArray(messages) ? messages : [],
      created_at: typeof obj.created_at === 'string' ? obj.created_at : undefined,
      updated_at: typeof obj.updated_at === 'string' ? obj.updated_at : undefined,
    }
  }
  return { id, messages: [] }
}

export type StreamHandlers = {
  onToken: (token: string) => void
  onMeta?: (meta: Partial<ChatResponse>) => void
  signal?: AbortSignal
}

/** Extract text tokens from assorted streaming payload shapes. */
function extractStreamToken(payload: unknown): {
  token?: string
  done?: boolean
  meta?: Partial<ChatResponse>
} {
  if (payload == null) return {}
  if (typeof payload === 'string') {
    if (payload === '[DONE]') return { done: true }
    return { token: payload }
  }
  if (typeof payload !== 'object') return {}
  const obj = payload as Record<string, unknown>

  if (obj.done === true || obj.type === 'done' || obj.event === 'done') {
    return { done: true, meta: obj as Partial<ChatResponse> }
  }

  const token =
    (typeof obj.token === 'string' && obj.token) ||
    (typeof obj.content === 'string' && obj.content) ||
    (typeof obj.delta === 'string' && obj.delta) ||
    (typeof obj.text === 'string' && obj.text) ||
    (typeof obj.response === 'string' && obj.response) ||
    (typeof obj.chunk === 'string' && obj.chunk) ||
    undefined

  const meta: Partial<ChatResponse> = {}
  if (typeof obj.conversation_id === 'string') meta.conversation_id = obj.conversation_id
  if (typeof obj.mode === 'string') meta.mode = obj.mode
  if (typeof obj.model_used === 'string') meta.model_used = obj.model_used
  if (typeof obj.tokens === 'number') meta.tokens = obj.tokens
  if (typeof obj.cost_usd === 'string') meta.cost_usd = obj.cost_usd
  if (typeof obj.calls_remaining_today === 'number') {
    meta.calls_remaining_today = obj.calls_remaining_today
  }

  return { token, meta: Object.keys(meta).length ? meta : undefined }
}

async function consumeChatStream(
  res: Response,
  handlers: StreamHandlers,
): Promise<Partial<ChatResponse>> {
  if (!res.body) {
    const text = await res.text()
    if (text) handlers.onToken(text)
    return {}
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let meta: Partial<ChatResponse> = {}
  let sawTokens = false

  const handleLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(':')) return

    let data = trimmed
    if (data.startsWith('data:')) {
      data = data.slice(5).trim()
    }
    if (!data || data === '[DONE]') return

    try {
      const parsed = extractStreamToken(JSON.parse(data))
      if (parsed.token) {
        sawTokens = true
        handlers.onToken(parsed.token)
      }
      if (parsed.meta) {
        meta = { ...meta, ...parsed.meta }
        handlers.onMeta?.(parsed.meta)
      }
    } catch {
      sawTokens = true
      handlers.onToken(data)
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split(/\r?\n/)
    buffer = parts.pop() ?? ''
    for (const line of parts) handleLine(line)
  }

  if (buffer.trim()) handleLine(buffer)

  // Non-SSE single JSON ChatResponse
  if (!sawTokens && buffer.trim().startsWith('{')) {
    try {
      const json = JSON.parse(buffer) as ChatResponse
      if (json.response) handlers.onToken(json.response)
      meta = { ...meta, ...json }
    } catch {
      // ignore
    }
  }

  return meta
}

export const chatbotService = {
  /** GET /chatbot/modes — public */
  async listModes() {
    try {
      const res = await apiClient.get<ChatModesResponse | string>(`${CHATBOT}/modes`)
      return normalizeModes(res.data)
    } catch {
      return CHAT_MODES
    }
  },

  /** GET /chatbot/me — JWT */
  async me(): Promise<ChatbotMe> {
    try {
      const res = await apiClient.get<ApiResponse<ChatbotMe>>(`${CHATBOT}/me`)
      return res.data.data
    } catch (error) {
      throw toChatbotError(error)
    }
  },

  /** GET /chatbot/usage — JWT */
  async usage(): Promise<ChatbotUsage> {
    try {
      const res = await apiClient.get<ApiResponse<ChatbotUsage>>(`${CHATBOT}/usage`)
      return res.data.data
    } catch (error) {
      throw toChatbotError(error)
    }
  },

  /** POST /chatbot/chat — JWT + daily limit */
  async chat(body: ChatRequest): Promise<ChatResponse> {
    // Use fetch so gateway error codes (e.g. CHATBOT_DAILY_LIMIT) are preserved.
    const res = await chatbotFetch('/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return res.json()
  },

  /** POST /chatbot/chat/stream — JWT + daily limit (SSE) */
  async chatStream(body: ChatRequest, handlers: StreamHandlers): Promise<Partial<ChatResponse>> {
    const res = await chatbotFetch('/chat/stream', {
      method: 'POST',
      body: JSON.stringify(body),
      signal: handlers.signal,
      headers: { Accept: 'text/event-stream, application/json, text/plain' },
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const json = (await res.json()) as ChatResponse
      if (json.response) handlers.onToken(json.response)
      handlers.onMeta?.(json)
      return json
    }

    return consumeChatStream(res, handlers)
  },

  /** GET /chatbot/conversations — JWT, own only */
  async listConversations(): Promise<ChatConversationSummary[]> {
    try {
      const res = await apiClient.get(`${CHATBOT}/conversations`)
      return asConversationList(res.data)
    } catch (error) {
      throw toChatbotError(error)
    }
  },

  /** GET /chatbot/conversations/:id — JWT + ownership */
  async getConversation(id: string): Promise<ChatConversationDetail> {
    try {
      const res = await apiClient.get(`${CHATBOT}/conversations/${id}`)
      return asConversationDetail(res.data, id)
    } catch (error) {
      throw toChatbotError(error)
    }
  },
}
