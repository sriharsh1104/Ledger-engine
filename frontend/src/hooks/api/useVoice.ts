import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { voiceService } from '../../services/voice.service'
import { queryKeys } from '../../lib/queryKeys'
import { unwrapApiData } from '../../lib/apiUtils'
import type {
  CreateVoiceRoomRequest,
  StartDirectCallRequest,
  StartGroupCallRequest,
} from '../../api/comms.types'

export function useVoiceRooms(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.voice.rooms(params),
    queryFn: async () => {
      const res = await voiceService.listRooms(params ?? { limit: 50 })
      return unwrapApiData(res) ?? []
    },
  })
}

export function useCreateVoiceRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateVoiceRoomRequest) => {
      const res = await voiceService.createRoom(data)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['voice', 'rooms'] })
    },
  })
}

export function useJoinVoiceRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      roomId,
      inviteCode,
    }: {
      roomId: string
      inviteCode?: string
    }) => {
      const res = await voiceService.joinRoom(roomId, inviteCode)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['voice', 'rooms'] })
    },
  })
}

export function useStartDirectCall() {
  return useMutation({
    mutationFn: async (data: StartDirectCallRequest) => {
      const res = await voiceService.startDirectCall(data)
      return unwrapApiData(res)
    },
  })
}

export function useStartGroupCall() {
  return useMutation({
    mutationFn: async (data: StartGroupCallRequest) => {
      const res = await voiceService.startGroupCall(data)
      return unwrapApiData(res)
    },
  })
}

export function useRespondCall() {
  return useMutation({
    mutationFn: async ({
      roomId,
      accept,
    }: {
      roomId: string
      accept: boolean
    }) => {
      const res = await voiceService.respondCall(roomId, { accept })
      return unwrapApiData(res)
    },
  })
}

export function useEndCall() {
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await voiceService.endCall(roomId)
      return unwrapApiData(res)
    },
  })
}

export function useLeaveVoiceRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await voiceService.leaveRoom(roomId)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['voice', 'rooms'] })
    },
  })
}
