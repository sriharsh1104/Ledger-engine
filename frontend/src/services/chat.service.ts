import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type {
  Channel,
  ChannelInvite,
  ChannelMember,
  ChannelMemberRole,
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

  /** Invite code + link + QR payload (group members only). */
  getChannelInvite: (channelId: string) =>
    apiClient.get<ApiResponse<ChannelInvite>>(
      `${CHAT}/channels/${channelId}/invite`,
    ),

  /** Preview a group before joining. */
  previewInvite: (inviteCode: string) =>
    apiClient.get<ApiResponse<Channel>>(`${CHAT}/invites/${inviteCode}`),

  /** Join group by unique invite code alone. */
  joinByInviteCode: (inviteCode: string) =>
    apiClient.post<ApiResponse<Channel>>(
      `${CHAT}/invites/${inviteCode}/join`,
    ),

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

  /** Owner: permanently delete a group (or conversation). */
  deleteChannel: (channelId: string) =>
    apiClient.delete<ApiResponse<unknown>>(`${CHAT}/channels/${channelId}`),

  listMembers: (channelId: string) =>
    apiClient.get<ApiResponse<ChannelMember[]>>(
      `${CHAT}/channels/${channelId}/members`,
    ),

  /** Owner/moderator: add a user to the group (e.g. from contacts). */
  addMember: (channelId: string, userId: string) =>
    apiClient.post<ApiResponse<ChannelMember>>(
      `${CHAT}/channels/${channelId}/members`,
      { userId },
    ),

  /** Owner → anyone; moderator → members only. */
  removeMember: (channelId: string, userId: string) =>
    apiClient.delete<ApiResponse<{ channelId: string; removedUserId: string }>>(
      `${CHAT}/channels/${channelId}/members/${userId}`,
    ),

  /** Owner only: promote/demote moderator. */
  updateMemberRole: (
    channelId: string,
    userId: string,
    role: Extract<ChannelMemberRole, 'moderator' | 'member'>,
  ) =>
    apiClient.patch<ApiResponse<ChannelMember>>(
      `${CHAT}/channels/${channelId}/members/${userId}`,
      { role },
    ),

  /** Owner/moderator: delete that user's messages in the channel. */
  deleteUserMessages: (channelId: string, userId: string) =>
    apiClient.delete<
      ApiResponse<{ channelId: string; targetUserId: string; deletedCount: number }>
    >(`${CHAT}/channels/${channelId}/members/${userId}/messages`),

  /** Owner/moderator: kick + ban join/search. */
  blockMember: (channelId: string, userId: string) =>
    apiClient.post<ApiResponse<{ channelId: string; blockedUserId: string }>>(
      `${CHAT}/channels/${channelId}/blocks/${userId}`,
    ),

  /** Owner/moderator: unblock (does not re-join). */
  unblockMember: (channelId: string, userId: string) =>
    apiClient.delete<ApiResponse<unknown>>(
      `${CHAT}/channels/${channelId}/blocks/${userId}`,
    ),

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

  /** Clear all messages in a channel (group or DM). Emits WS `chat.cleared`. */
  clearMessages: (channelId: string) =>
    apiClient.delete<ApiResponse<{ channelId: string; deletedCount: number }>>(
      `${CHAT}/channels/${channelId}/messages`,
    ),
}
