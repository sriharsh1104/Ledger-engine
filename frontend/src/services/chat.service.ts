import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type {
  Channel,
  ChatMessage,
  CreateChannelRequest,
  CreateDirectChannelRequest,
  JoinChannelRequest,
  SendMessageRequest,
} from '../api/comms.types'

const CHAT = '/chat'

export const chatService = {
  listChannels: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<Channel[]>>(`${CHAT}/channels`, { params }),

  /** Discover public groups by name — does not auto-join */
  searchChannels: (q: string, limit = 20) =>
    apiClient.get<ApiResponse<Channel[]>>(`${CHAT}/channels/search`, {
      params: { q, limit },
    }),

  getChannel: (channelId: string) =>
    apiClient.get<ApiResponse<Channel>>(`${CHAT}/channels/${channelId}`),

  createChannel: (data: CreateChannelRequest) =>
    apiClient.post<ApiResponse<Channel>>(`${CHAT}/channels`, data),

  createDirect: (data: CreateDirectChannelRequest) =>
    apiClient.post<ApiResponse<Channel>>(`${CHAT}/channels/direct`, data),

  joinChannel: (channelId: string, data: JoinChannelRequest = {}) =>
    apiClient.post<ApiResponse<Channel>>(
      `${CHAT}/channels/${channelId}/join`,
      {
        inviteCode: data.inviteCode ?? '',
        ...(data.password ? { password: data.password } : {}),
      },
    ),

  leaveChannel: (channelId: string) =>
    apiClient.post<ApiResponse<unknown>>(`${CHAT}/channels/${channelId}/leave`),

  listMessages: (
    channelId: string,
    params?: { limit?: number; beforeId?: string },
  ) =>
    apiClient.get<ApiResponse<ChatMessage[]>>(
      `${CHAT}/channels/${channelId}/messages`,
      { params },
    ),

  sendMessage: (channelId: string, data: SendMessageRequest) =>
    apiClient.post<ApiResponse<ChatMessage>>(
      `${CHAT}/channels/${channelId}/messages`,
      data,
    ),
}
