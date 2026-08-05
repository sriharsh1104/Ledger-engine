import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { voiceService } from '../../services/voice.service'
import { queryKeys } from '../../lib/queryKeys'
import { unwrapApiData } from '../../lib/apiUtils'
import type {
  CreateVoiceRoomRequest,
  JoinVoiceRoomRequest,
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

export function useCallHistory(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.voice.callHistory(params),
    queryFn: async () => {
      const res = await voiceService.getCallHistory(params ?? { limit: 50 })
      return unwrapApiData(res) ?? []
    },
  })
}

function invalidateCallHistory(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['voice', 'calls', 'history'] })
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
      password,
    }: {
      roomId: string
    } & JoinVoiceRoomRequest) => {
      const res = await voiceService.joinRoom(roomId, { inviteCode, password })
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['voice', 'rooms'] })
    },
  })
}

export function useStartDirectCall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: StartDirectCallRequest) => {
      const res = await voiceService.startDirectCall(data)
      return unwrapApiData(res)
    },
    onSuccess: () => invalidateCallHistory(qc),
  })
}

export function useStartGroupCall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: StartGroupCallRequest) => {
      const res = await voiceService.startGroupCall(data)
      return unwrapApiData(res)
    },
    onSuccess: () => invalidateCallHistory(qc),
  })
}

export function useRespondCall() {
  const qc = useQueryClient()
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
    onSuccess: () => invalidateCallHistory(qc),
  })
}

export function useEndCall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await voiceService.endCall(roomId)
      return unwrapApiData(res)
    },
    onSuccess: () => invalidateCallHistory(qc),
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

export function useClearCallHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await voiceService.clearCallHistory()
      return unwrapApiData(res)
    },
    onSuccess: () => invalidateCallHistory(qc),
  })
}

export function useHideCallFromHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (callId: string) => {
      const res = await voiceService.hideCallFromHistory(callId)
      return unwrapApiData(res)
    },
    onSuccess: () => invalidateCallHistory(qc),
  })
}
