import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type {
  CallHistoryEntry,
  CallSession,
  CreateVoiceRoomRequest,
  JoinVoiceRoomRequest,
  LiveKitCredentials,
  RespondCallRequest,
  RoomSession,
  StartDirectCallRequest,
  StartGroupCallRequest,
  VoiceRoom,
} from '../api/comms.types'
import type { User } from '../types'

const VOICE = '/voice'

export const voiceService = {
  /**
   * Discover public voice lobbies.
   * GET /voice/rooms?q=
   */
  discoverRooms: (params?: { q?: string; limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<VoiceRoom[]>>(`${VOICE}/rooms`, { params }),

  /**
   * Sidebar — rooms you’ve created or joined.
   * GET /voice/rooms/mine
   */
  listMyRooms: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<VoiceRoom[]>>(`${VOICE}/rooms/mine`, { params }),

  getRoom: (roomId: string) =>
    apiClient.get<ApiResponse<VoiceRoom>>(`${VOICE}/rooms/${roomId}`),

  /** Create lobby — only creator is on their mine list. */
  createRoom: (data: CreateVoiceRoomRequest) =>
    apiClient.post<ApiResponse<VoiceRoom | RoomSession>>(`${VOICE}/rooms`, data),

  /**
   * Opt-in membership (no LiveKit, no notifications).
   * POST /voice/rooms/:id/join
   */
  joinRoom: (roomId: string, data: JoinVoiceRoomRequest = {}) =>
    apiClient.post<ApiResponse<VoiceRoom | RoomSession>>(
      `${VOICE}/rooms/${roomId}/join`,
      {
        inviteCode: data.inviteCode ?? '',
        ...(data.password ? { password: data.password } : {}),
      },
    ),

  /**
   * Start talking — LiveKit token + presence.
   * POST /voice/rooms/:id/connect
   */
  connectRoom: (roomId: string) =>
    apiClient.post<ApiResponse<LiveKitCredentials | RoomSession>>(
      `${VOICE}/rooms/${roomId}/connect`,
    ),

  /**
   * Stop talking — leave LiveKit, stay on mine list.
   * POST /voice/rooms/:id/disconnect
   */
  disconnectRoom: (roomId: string) =>
    apiClient.post<ApiResponse<unknown>>(
      `${VOICE}/rooms/${roomId}/disconnect`,
    ),

  /**
   * Remove membership from your list.
   * POST /voice/rooms/:id/leave
   */
  leaveRoom: (roomId: string) =>
    apiClient.post<ApiResponse<unknown>>(`${VOICE}/rooms/${roomId}/leave`),

  /**
   * Owner: delete lobby for everyone.
   * DELETE /voice/rooms/:id
   */
  deleteRoom: (roomId: string) =>
    apiClient.delete<ApiResponse<unknown>>(`${VOICE}/rooms/${roomId}`),

  /** @deprecated prefer connectRoom */
  refreshLivekitToken: (roomId: string) =>
    apiClient.get<ApiResponse<LiveKitCredentials>>(
      `${VOICE}/rooms/${roomId}/livekit-token`,
    ),

  listMembers: (roomId: string) =>
    apiClient.get<ApiResponse<User[]>>(`${VOICE}/rooms/${roomId}/members`),

  startDirectCall: (data: StartDirectCallRequest) =>
    apiClient.post<ApiResponse<CallSession>>(`${VOICE}/calls/direct`, data),

  startGroupCall: (data: StartGroupCallRequest) =>
    apiClient.post<ApiResponse<CallSession>>(`${VOICE}/calls/group`, data),

  respondCall: (roomId: string, data: RespondCallRequest) =>
    apiClient.post<ApiResponse<CallSession>>(
      `${VOICE}/calls/${roomId}/respond`,
      data,
    ),

  endCall: (roomId: string) =>
    apiClient.post<ApiResponse<unknown>>(`${VOICE}/calls/${roomId}/end`),

  inviteToCall: (roomId: string, peerUserId: string) =>
    apiClient.post<ApiResponse<unknown>>(`${VOICE}/calls/${roomId}/invite`, {
      peerUserId,
    }),

  getCallHistory: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<CallHistoryEntry[]>>(
      `${VOICE}/calls/history`,
      { params },
    ),

  clearCallHistory: () =>
    apiClient.delete<ApiResponse<{ hiddenCount: number }>>(
      `${VOICE}/calls/history`,
    ),

  hideCallFromHistory: (callId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(
      `${VOICE}/calls/history/${callId}`,
    ),
}
