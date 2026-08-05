import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type {
  CallSession,
  CreateVoiceRoomRequest,
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
  listRooms: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<VoiceRoom[]>>(`${VOICE}/rooms`, { params }),

  getRoom: (roomId: string) =>
    apiClient.get<ApiResponse<VoiceRoom>>(`${VOICE}/rooms/${roomId}`),

  createRoom: (data: CreateVoiceRoomRequest) =>
    apiClient.post<ApiResponse<RoomSession>>(`${VOICE}/rooms`, data),

  joinRoom: (roomId: string, inviteCode = '') =>
    apiClient.post<ApiResponse<RoomSession>>(`${VOICE}/rooms/${roomId}/join`, {
      inviteCode,
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
}