import { apiClient } from '../api/client'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ChangePasswordRequest,
} from '../api/types'

const AUTH = '/auth'

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>(`${AUTH}/login`, data),

  signup: (data: SignupRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>(`${AUTH}/signup`, data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<ApiResponse<ForgotPasswordResponse>>(`${AUTH}/forgot-password`, data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<ApiResponse<{ message: string }>>(`${AUTH}/change-password`, data),

  me: () => apiClient.get<ApiResponse<LoginResponse['user']>>(`${AUTH}/me`),
}
