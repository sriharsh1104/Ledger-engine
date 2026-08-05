function deriveWsBaseUrl(apiBaseUrl: string): string {
  const fromEnv = import.meta.env.VITE_WS_URL as string | undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  // Prefer direct gateway WS in dev. Vite's /ws proxy often ECONNRESET
  // and drops chat realtime; browser → :8088 WebSocket is fine with token query.
  if (import.meta.env.DEV) {
    try {
      const url = new URL(apiBaseUrl || 'http://127.0.0.1:8088/api/v1')
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      url.pathname = '/ws'
      url.search = ''
      url.hash = ''
      return url.toString().replace(/\/$/, '')
    } catch {
      return 'ws://127.0.0.1:8088/ws'
    }
  }

  try {
    const url = new URL(apiBaseUrl || 'http://127.0.0.1:8088/api/v1')
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/ws'
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return 'ws://127.0.0.1:8088/ws'
  }
}

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
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
  wsUrl: deriveWsBaseUrl(import.meta.env.VITE_API_BASE_URL ?? ''),
} as const
