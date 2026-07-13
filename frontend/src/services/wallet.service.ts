import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type { Wallet } from '../types'

export const walletService = {
  getAll: () => apiClient.get<ApiResponse<Wallet[]>>('/wallets'),

  getById: (id: string) => apiClient.get<ApiResponse<Wallet>>(`/wallets/${id}`),

  getBalance: (id: string) =>
    apiClient.get<ApiResponse<{ available: number; pending: number }>>(
      `/wallets/${id}/balance`,
    ),
}
