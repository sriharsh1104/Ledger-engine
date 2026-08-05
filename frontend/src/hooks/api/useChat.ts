import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../../services/chat.service'
import { queryKeys } from '../../lib/queryKeys'
import { unwrapApiData } from '../../lib/apiUtils'
import type {
  Channel,
  ChatMessage,
  CreateChannelRequest,
  CreateDirectChannelRequest,
  JoinChannelRequest,
} from '../../api/comms.types'

export function useChannels(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.chat.channels(params),
    queryFn: async () => {
      const res = await chatService.listChannels(params ?? { limit: 50 })
      return unwrapApiData(res) ?? []
    },
  })
}

export function useSearchChannels(q: string, enabled = true) {
  const trimmed = q.trim()
  return useQuery({
    queryKey: queryKeys.chat.search(trimmed),
    enabled: enabled && trimmed.length >= 1,
    queryFn: async () => {
      const res = await chatService.searchChannels(trimmed)
      return unwrapApiData(res) ?? []
    },
  })
}

export function useChannelMessages(channelId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(channelId ?? ''),
    enabled: !!channelId,
    queryFn: async () => {
      const res = await chatService.listMessages(channelId!, { limit: 100 })
      const list = unwrapApiData(res) ?? []
      return [...list].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    },
  })
}

export function useCreateChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateChannelRequest) => {
      const res = await chatService.createChannel(data)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
    },
  })
}

export function useCreateDirectChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateDirectChannelRequest) => {
      const res = await chatService.createDirect(data)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
    },
  })
}

export function useJoinChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      inviteCode,
      password,
    }: {
      channelId: string
      inviteCode?: string
      password?: string
    } & JoinChannelRequest) => {
      const res = await chatService.joinChannel(channelId, {
        inviteCode,
        password,
      })
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
    },
  })
}

/** Join group by invite code alone (no channel id). */
export function useJoinByInviteCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await chatService.joinByInviteCode(inviteCode)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
    },
  })
}

export function usePreviewInvite(inviteCode: string, enabled = true) {
  const trimmed = inviteCode.trim()
  return useQuery({
    queryKey: [...queryKeys.chat.invite(trimmed)],
    enabled: enabled && trimmed.length >= 2,
    queryFn: async () => {
      const res = await chatService.previewInvite(trimmed)
      return unwrapApiData(res)
    },
  })
}

export function useChannelInvite(channelId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chat.channelInvite(channelId ?? ''),
    enabled: enabled && !!channelId,
    queryFn: async () => {
      const res = await chatService.getChannelInvite(channelId!)
      return unwrapApiData(res)
    },
  })
}

export function useClearMessages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await chatService.clearMessages(channelId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, channelId) => {
      qc.setQueryData<ChatMessage[]>(queryKeys.chat.messages(channelId), [])
    },
  })
}

function invalidateMembers(
  qc: ReturnType<typeof useQueryClient>,
  channelId: string,
) {
  void qc.invalidateQueries({ queryKey: queryKeys.chat.members(channelId) })
  void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
}

export function useChannelMembers(channelId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chat.members(channelId ?? ''),
    enabled: enabled && !!channelId,
    queryFn: async () => {
      const res = await chatService.listMembers(channelId!)
      return unwrapApiData(res) ?? []
    },
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      userId,
    }: {
      channelId: string
      userId: string
    }) => {
      const res = await chatService.removeMember(channelId, userId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, { channelId }) => invalidateMembers(qc, channelId),
  })
}

export function useAddMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      userId,
    }: {
      channelId: string
      userId: string
    }) => {
      const res = await chatService.addMember(channelId, userId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, { channelId }) => invalidateMembers(qc, channelId),
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      userId,
      role,
    }: {
      channelId: string
      userId: string
      role: 'moderator' | 'member'
    }) => {
      const res = await chatService.updateMemberRole(channelId, userId, role)
      return unwrapApiData(res)
    },
    onSuccess: (_data, { channelId }) => invalidateMembers(qc, channelId),
  })
}

export function useDeleteUserMessages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      userId,
    }: {
      channelId: string
      userId: string
    }) => {
      const res = await chatService.deleteUserMessages(channelId, userId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, { channelId, userId }) => {
      qc.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (prev) => (prev ?? []).filter((m) => m.senderId !== userId),
      )
    },
  })
}

export function useBlockMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      userId,
    }: {
      channelId: string
      userId: string
    }) => {
      const res = await chatService.blockMember(channelId, userId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, { channelId }) => invalidateMembers(qc, channelId),
  })
}

export function useUnblockMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channelId,
      userId,
    }: {
      channelId: string
      userId: string
    }) => {
      const res = await chatService.unblockMember(channelId, userId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, { channelId }) => invalidateMembers(qc, channelId),
  })
}

export function useLeaveChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await chatService.leaveChannel(channelId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, channelId) => {
      removeChannelFromList(qc, channelId)
      qc.removeQueries({ queryKey: queryKeys.chat.messages(channelId) })
      qc.removeQueries({ queryKey: queryKeys.chat.members(channelId) })
      void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
    },
  })
}

/** Owner: delete entire group / channel. */
export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await chatService.deleteChannel(channelId)
      return unwrapApiData(res)
    },
    onSuccess: (_data, channelId) => {
      removeChannelFromList(qc, channelId)
      qc.removeQueries({ queryKey: queryKeys.chat.messages(channelId) })
      qc.removeQueries({ queryKey: queryKeys.chat.members(channelId) })
      void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
    },
  })
}

export function useSendMessage(channelId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      if (!channelId) throw new Error('No channel selected')
      const res = await chatService.sendMessage(channelId, { body })
      return unwrapApiData(res)
    },
    onSuccess: (msg) => {
      if (!channelId || !msg) return
      qc.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(channelId),
        (prev) => {
          const list = prev ?? []
          if (list.some((m) => m.id === msg.id)) return list
          return [...list, msg]
        },
      )
    },
  })
}

export function appendChannelMessage(
  qc: ReturnType<typeof useQueryClient>,
  message: ChatMessage,
) {
  qc.setQueryData<ChatMessage[]>(
    queryKeys.chat.messages(message.channelId),
    (prev) => {
      const list = prev ?? []
      if (list.some((m) => m.id === message.id)) return list
      return [...list, message]
    },
  )
}

export function clearChannelMessages(
  qc: ReturnType<typeof useQueryClient>,
  channelId: string,
) {
  qc.setQueryData<ChatMessage[]>(queryKeys.chat.messages(channelId), [])
}

export function removeMessagesBySender(
  qc: ReturnType<typeof useQueryClient>,
  channelId: string,
  senderId: string,
) {
  qc.setQueryData<ChatMessage[]>(
    queryKeys.chat.messages(channelId),
    (prev) => (prev ?? []).filter((m) => m.senderId !== senderId),
  )
}

export function removeChannelFromList(
  qc: ReturnType<typeof useQueryClient>,
  channelId: string,
) {
  qc.setQueryData<Channel[]>(queryKeys.chat.channels({ limit: 50 }), (prev) =>
    (prev ?? []).filter((c) => c.id !== channelId),
  )
}

export function upsertChannel(
  qc: ReturnType<typeof useQueryClient>,
  channel: Channel,
) {
  qc.setQueryData<Channel[]>(queryKeys.chat.channels({ limit: 50 }), (prev) => {
    const list = prev ?? []
    const idx = list.findIndex((c) => c.id === channel.id)
    if (idx >= 0) {
      const next = [...list]
      next[idx] = channel
      return next
    }
    return [channel, ...list]
  })
}
