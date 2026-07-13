import { apiClient } from '../api/client'
import type { ApiResponse, CreateTransferRequest, PaginatedParams } from '../api/types'
import type { Transfer } from '../types'

export const transferService = {
  getAll: (params?: PaginatedParams) =>
    apiClient.get<ApiResponse<Transfer[]>>('/transfers', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Transfer>>(`/transfers/${id}`),

  create: (data: CreateTransferRequest) =>
    apiClient.post<ApiResponse<Transfer>>('/transfers', data),
}
