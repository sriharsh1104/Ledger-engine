export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  /**
   * Mock mode: explicit VITE_USE_MOCK_API=true, or dev default unless set to false.
   * Set VITE_USE_MOCK_API=false when Go API is running.
   */
  useMockApi:
    import.meta.env.VITE_USE_MOCK_API === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API !== 'false'),
} as const
