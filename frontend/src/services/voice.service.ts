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
  /** Public voice lobbies only — private rooms are invite+password */
  listRooms: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<VoiceRoom[]>>(`${VOICE}/rooms`, { params }),

  getRoom: (roomId: string) =>
    apiClient.get<ApiResponse<VoiceRoom>>(`${VOICE}/rooms/${roomId}`),

  createRoom: (data: CreateVoiceRoomRequest) =>
    apiClient.post<ApiResponse<RoomSession>>(`${VOICE}/rooms`, data),

  joinRoom: (roomId: string, data: JoinVoiceRoomRequest = {}) =>
    apiClient.post<ApiResponse<RoomSession>>(`${VOICE}/rooms/${roomId}/join`, {
      inviteCode: data.inviteCode ?? '',
      ...(data.password ? { password: data.password } : {}),
    }),

  leaveRoom: (roomId: string) =>
    apiClient.post<ApiResponse<unknown>>(`${VOICE}/rooms/${roomId}/leave`),

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

  /** Call history for the authenticated user only. */
  getCallHistory: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<CallHistoryEntry[]>>(
      `${VOICE}/calls/history`,
      { params },
    ),

  /** Hide all calls from this user's history (others unaffected). */
  clearCallHistory: () =>
    apiClient.delete<ApiResponse<{ hiddenCount: number }>>(
      `${VOICE}/calls/history`,
    ),

  /** Hide one call from this user's history. */
  hideCallFromHistory: (callId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(
      `${VOICE}/calls/history/${callId}`,
    ),
}
