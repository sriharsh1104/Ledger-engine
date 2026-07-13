import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type { ProfileUpdate, User } from '../types'

export const profileService = {
  get: () => apiClient.get<ApiResponse<User>>('/profile'),

  update: (data: ProfileUpdate) =>
    apiClient.patch<ApiResponse<User>>('/profile', data),
}
