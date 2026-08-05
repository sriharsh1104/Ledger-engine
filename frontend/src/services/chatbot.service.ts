import { chatbotFetch, getChatbotBaseUrl } from '../api/chatbotClient'
import type {
  ChatConversationDetail,
  ChatConversationSummary,
  ChatMode,
  ChatModesResponse,
  ChatRequest,
  ChatResponse,
  ChatUserInfo,
} from '../api/chatbot.types'

export const CHAT_MODES: { id: ChatMode; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'ruby', label: 'Ruby / Rails' },
  { id: 'python', label: 'Python' },
  { id: 'sql', label: 'SQL' },
  { id: 'code-review', label: 'Code Review' },
]

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
function extractStreamToken(payload: unknown): { token?: string; done?: boolean; meta?: Partial<ChatResponse> } {
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
      // plain text chunk
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

  // If the body was a single JSON ChatResponse (non-SSE), parse it.
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
  async health() {
    const res = await fetch(`${getChatbotBaseUrl()}/health`)
    if (!res.ok) throw new Error('Chatbot health check failed')
    return res.json()
  },

  async listModes() {
    const res = await fetch(`${getChatbotBaseUrl()}/modes`)
    if (!res.ok) return CHAT_MODES
    const data = (await res.json()) as ChatModesResponse
    return normalizeModes(data)
  },

  async me(): Promise<ChatUserInfo> {
    const res = await chatbotFetch('/me')
    return res.json()
  },

  async chat(body: ChatRequest): Promise<ChatResponse> {
    const res = await chatbotFetch('/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return res.json()
  },

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

  async listConversations(): Promise<ChatConversationSummary[]> {
    const res = await chatbotFetch('/conversations')
    const data = await res.json()
    return asConversationList(data)
  },

  async getConversation(id: string): Promise<ChatConversationDetail> {
    const res = await chatbotFetch(`/conversations/${id}`)
    const data = await res.json()
    return asConversationDetail(data, id)
  },
}
