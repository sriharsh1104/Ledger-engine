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
  chat: {
    channels: (params?: { limit?: number; offset?: number }) =>
      ['chat', 'channels', params] as const,
    channel: (id: string) => ['chat', 'channel', id] as const,
    messages: (channelId: string) => ['chat', 'messages', channelId] as const,
  },
  voice: {
    rooms: (params?: { limit?: number; offset?: number }) =>
      ['voice', 'rooms', params] as const,
    room: (id: string) => ['voice', 'room', id] as const,
    members: (roomId: string) => ['voice', 'members', roomId] as const,
  },
  contacts: {
    list: (params?: { limit?: number; offset?: number }) =>
      ['contacts', 'list', params] as const,
    userSearch: (q: string) => ['contacts', 'users', 'search', q] as const,
    contactSearch: (q: string) => ['contacts', 'search', q] as const,
  },
} as const
