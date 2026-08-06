import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { voiceService } from '../../services/voice.service'
import { queryKeys } from '../../lib/queryKeys'
import { unwrapApiData } from '../../lib/apiUtils'
import type {
  CreateVoiceRoomRequest,
  JoinVoiceRoomRequest,
  LiveKitCredentials,
  RoomSession,
  StartDirectCallRequest,
  StartGroupCallRequest,
  VoiceRoom,
} from '../../api/comms.types'

function extractRooms(data: unknown): VoiceRoom[] {
  if (!data) return []
  if (Array.isArray(data)) return data as VoiceRoom[]
  if (typeof data === 'object') {
    const obj = data as { rooms?: VoiceRoom[]; items?: VoiceRoom[] }
    if (Array.isArray(obj.rooms)) return obj.rooms
    if (Array.isArray(obj.items)) return obj.items
  }
  return []
}

export function extractVoiceRoom(data: unknown): VoiceRoom {
  if (data && typeof data === 'object' && 'room' in data) {
    return (data as RoomSession).room
  }
  return data as VoiceRoom
}

export function extractLivekit(data: unknown): LiveKitCredentials | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>
  if (obj.livekit && typeof obj.livekit === 'object') {
    return obj.livekit as LiveKitCredentials
  }
  if (typeof obj.url === 'string' && typeof obj.token === 'string') {
    return obj as unknown as LiveKitCredentials
  }
  return null
}

function invalidateMyRooms(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['voice', 'rooms', 'mine'] })
  void qc.invalidateQueries({ queryKey: ['voice', 'rooms', 'discover'] })
}

export function removeVoiceRoomFromList(
  qc: ReturnType<typeof useQueryClient>,
  roomId: string,
) {
  const patch = (prev: VoiceRoom[] | undefined) =>
    (prev ?? []).filter((r) => r.id !== roomId)

  qc.setQueriesData<VoiceRoom[]>(
    { queryKey: ['voice', 'rooms', 'mine'] },
    patch,
  )
  qc.setQueriesData<VoiceRoom[]>(
    { queryKey: ['voice', 'rooms', 'discover'] },
    patch,
  )
}

/** Sidebar — GET /voice/rooms/mine */
export function useMyVoiceRooms(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.voice.myRooms(params),
    queryFn: async () => {
      const res = await voiceService.listMyRooms(params ?? { limit: 50 })
      return extractRooms(unwrapApiData(res))
    },
  })
}

/** Discover public lobbies — GET /voice/rooms?q= */
export function useDiscoverVoiceRooms(q: string, enabled = true) {
  const trimmed = q.trim()
  return useQuery({
    queryKey: queryKeys.voice.discover(trimmed),
    enabled,
    queryFn: async () => {
      const res = await voiceService.discoverRooms({
        q: trimmed || undefined,
        limit: 50,
      })
      return extractRooms(unwrapApiData(res))
    },
    staleTime: 15_000,
  })
}

/** @deprecated use useMyVoiceRooms — kept so older imports keep working */
export function useVoiceRooms(params?: { limit?: number; offset?: number }) {
  return useMyVoiceRooms(params)
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
      const raw = unwrapApiData(res)
      return {
        room: extractVoiceRoom(raw),
        livekit: extractLivekit(raw),
      }
    },
    onSuccess: ({ room }) => {
      if (room) {
        qc.setQueriesData<VoiceRoom[]>(
          { queryKey: ['voice', 'rooms', 'mine'] },
          (prev) => {
            const list = prev ?? []
            if (list.some((r) => r.id === room.id)) return list
            return [room, ...list]
          },
        )
      }
      invalidateMyRooms(qc)
    },
  })
}

/** Membership only — no LiveKit. */
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
      const raw = unwrapApiData(res)
      return {
        room: extractVoiceRoom(raw),
        livekit: extractLivekit(raw),
      }
    },
    onSuccess: ({ room }) => {
      if (room) {
        qc.setQueriesData<VoiceRoom[]>(
          { queryKey: ['voice', 'rooms', 'mine'] },
          (prev) => {
            const list = prev ?? []
            if (list.some((r) => r.id === room.id)) return list
            return [room, ...list]
          },
        )
      }
      invalidateMyRooms(qc)
    },
  })
}

/** Start talking — LiveKit credentials. */
export function useConnectVoiceRoom() {
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await voiceService.connectRoom(roomId)
      const raw = unwrapApiData(res)
      const livekit = extractLivekit(raw)
      if (!livekit?.url || !livekit?.token) {
        throw new Error('Voice connect did not return LiveKit credentials')
      }
      return {
        room: (() => {
          try {
            return extractVoiceRoom(raw)
          } catch {
            return null
          }
        })(),
        livekit,
      }
    },
  })
}

/** Stop talking — stay on mine list. */
export function useDisconnectVoiceRoom() {
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await voiceService.disconnectRoom(roomId)
      return unwrapApiData(res)
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

/** Remove from your mine list (membership delete). */
export function useLeaveVoiceRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await voiceService.leaveRoom(roomId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, roomId) => {
      removeVoiceRoomFromList(qc, roomId)
      invalidateMyRooms(qc)
    },
  })
}

/** Owner: delete lobby for everyone. */
export function useDeleteVoiceRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await voiceService.deleteRoom(roomId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, roomId) => {
      removeVoiceRoomFromList(qc, roomId)
      invalidateMyRooms(qc)
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
