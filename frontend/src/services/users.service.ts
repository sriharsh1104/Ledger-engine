import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type { UserStatus, UserStatusUpdate } from '../types'

export interface MyStatusData {
  status: UserStatus
}

export interface UsersStatusMap {
  /** userId → status */
  statuses: Record<string, UserStatus>
}

export const usersService = {
  /** GET /users/me/status */
  getMyStatus: () =>
    apiClient.get<ApiResponse<MyStatusData | UserStatusUpdate>>('/users/me/status'),

  /** PATCH /users/me/status — { status } */
  updateMyStatus: (status: UserStatus) =>
    apiClient.patch<ApiResponse<MyStatusData | UserStatusUpdate>>('/users/me/status', {
      status,
    }),

  /** GET /users/status?ids=uuid1,uuid2 */
  getUsersStatus: (ids: string[]) =>
    apiClient.get<ApiResponse<UsersStatusMap | Record<string, UserStatus>>>('/users/status', {
      params: { ids: ids.join(',') },
    }),
}
