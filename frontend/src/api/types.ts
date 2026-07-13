import type { User } from '../types'

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface SignupRequest {
  name: string
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface CreateTransferRequest {
  fromWalletId: string
  toWalletId: string
  amount: number
  memo?: string
}

export interface PaginatedParams {
  page?: number
  limit?: number
}

export interface LedgerEntriesParams extends PaginatedParams {
  account?: string
}
