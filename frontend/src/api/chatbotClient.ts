import { config } from '../lib/config'

const API_KEY_STORAGE = 'ledger_chatbot_api_key'

export function getChatbotApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(API_KEY_STORAGE)?.trim()
    if (stored) return stored
  }
  return config.chatbotApiKey.trim()
}

export function setChatbotApiKey(key: string) {
  const trimmed = key.trim()
  if (trimmed) {
    localStorage.setItem(API_KEY_STORAGE, trimmed)
  } else {
    localStorage.removeItem(API_KEY_STORAGE)
  }
}

export function clearChatbotApiKey() {
  localStorage.removeItem(API_KEY_STORAGE)
}

export function getChatbotBaseUrl(): string {
  return config.chatbotApiUrl.replace(/\/$/, '')
}

export class ChatbotApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ChatbotApiError'
    this.status = status
    this.code = code
  }
}

async function parseError(res: Response): Promise<ChatbotApiError> {
  let message = res.statusText || 'Chatbot request failed'
  let code: string | undefined
  try {
    const body = await res.json()
    const detail = body?.detail
    if (typeof detail === 'string') {
      message = detail
    } else if (detail && typeof detail === 'object') {
      message = detail.message ?? detail.error ?? message
      code = detail.error
    } else if (typeof body?.message === 'string') {
      message = body.message
    }
  } catch {
    // ignore JSON parse errors
  }
  return new ChatbotApiError(message, res.status, code)
}

export async function chatbotFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const apiKey = getChatbotApiKey()
  if (!apiKey) {
    throw new ChatbotApiError(
      'Missing chatbot API key. Add VITE_CHATBOT_API_KEY or save a key in Assistant settings.',
      401,
      'missing_api_key',
    )
  }

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', headers.get('Accept') ?? 'application/json')
  headers.set('X-API-Key', apiKey)

  const res = await fetch(`${getChatbotBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return res
}
