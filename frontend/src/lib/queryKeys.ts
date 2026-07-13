export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  wallets: {
    all: ['wallets'] as const,
    detail: (id: string) => ['wallets', id] as const,
    balance: (id: string) => ['wallets', id, 'balance'] as const,
  },
  transfers: {
    all: (params?: { page?: number; limit?: number }) =>
      ['transfers', params] as const,
    detail: (id: string) => ['transfers', id] as const,
  },
  ledger: {
    audit: ['ledger', 'audit'] as const,
    entries: (params?: { page?: number; limit?: number; account?: string }) =>
      ['ledger', 'entries', params] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
} as const
