import { config } from '../lib/config'

const TOKEN_KEY = 'ledger_token'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/** Ready when the user has a JWT (api-gateway chatbot routes). */
export function canUseChatbot(): boolean {
  return Boolean(getAuthToken()?.trim())
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
      code = detail.error ?? detail.code
    } else if (typeof body?.message === 'string') {
      message = body.message
      code = typeof body?.code === 'string' ? body.code : code
    }
  } catch {
    // ignore JSON parse errors
  }
  return new ChatbotApiError(message, res.status, code)
}

/**
 * Authenticated fetch against api-gateway `/api/v1/chatbot/*`.
 * Used for streaming; JSON endpoints prefer axios `apiClient`.
 */
export async function chatbotFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken()?.trim()
  if (!token) {
    throw new ChatbotApiError(
      'Sign in to use the AI assistant.',
      401,
      'missing_auth',
    )
  }

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  headers.set('Accept', headers.get('Accept') ?? 'application/json')
  headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${getChatbotBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  if (!res.ok) {
    throw await parseError(res)
  }

  return res
}
