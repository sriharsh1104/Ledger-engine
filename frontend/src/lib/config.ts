function deriveApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  // Empty / relative → same host as the page (works on localhost AND LAN IP)
  if (!fromEnv || fromEnv === '/' || fromEnv.startsWith('/')) {
    return fromEnv && fromEnv !== '/' ? fromEnv.replace(/\/$/, '') : '/api/v1'
  }

  // Absolute URL with localhost → rewrite to current page hostname for LAN testing
  try {
    const url = new URL(fromEnv)
    if (
      typeof window !== 'undefined' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    ) {
      url.hostname = window.location.hostname
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    // keep as-is
  }
  return fromEnv.replace(/\/$/, '')
}

function deriveWsBaseUrl(apiBaseUrl: string): string {
  const fromEnv = (import.meta.env.VITE_WS_URL as string | undefined)?.trim()
  if (fromEnv) {
    try {
      const url = new URL(fromEnv)
      if (
        typeof window !== 'undefined' &&
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
      ) {
        // Same host as the opened page (e.g. 10.10.0.52)
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        return `${proto}//${window.location.hostname}:${url.port || '8088'}${url.pathname}`.replace(
          /\/$/,
          '',
        )
      }
      return fromEnv.replace(/\/$/, '')
    } catch {
      return fromEnv.replace(/\/$/, '')
    }
  }

  // Dev default: go through Vite /ws proxy on the same host the user opened
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/ws`
  }

  try {
    const url = new URL(
      apiBaseUrl.startsWith('http')
        ? apiBaseUrl
        : typeof window !== 'undefined'
          ? `${window.location.origin}${apiBaseUrl}`
          : `http://127.0.0.1:8088${apiBaseUrl}`,
    )
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/ws'
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return 'ws://127.0.0.1:8088/ws'
  }
}

const apiBaseUrl = deriveApiBaseUrl()

export const config = {
  apiBaseUrl,
  /**
   * Mock mode: explicit VITE_USE_MOCK_API=true, or dev default unless set to false.
   * Set VITE_USE_MOCK_API=false when Go API is running.
   */
  useMockApi:
    import.meta.env.VITE_USE_MOCK_API === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API !== 'false'),
  /** AI CLI Chatbot API (https://ai-cli-chatbot-production.up.railway.app) */
  chatbotApiUrl:
    import.meta.env.VITE_CHATBOT_API_URL ??
    'https://ai-cli-chatbot-production.up.railway.app',
  chatbotApiKey: import.meta.env.VITE_CHATBOT_API_KEY ?? '',
  /** Gateway WebSocket — connect only on Chat/Call screens */
  wsUrl: deriveWsBaseUrl(apiBaseUrl),
} as const
