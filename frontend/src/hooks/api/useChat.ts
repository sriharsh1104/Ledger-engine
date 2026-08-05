import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../../services/chat.service'
import { queryKeys } from '../../lib/queryKeys'
import { unwrapApiData } from '../../lib/apiUtils'
import type {
  Channel,
  ChatMessage,
  CreateChannelRequest,
  CreateDirectChannelRequest,
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
    }: {
      channelId: string
      inviteCode?: string
    }) => {
      const res = await chatService.joinChannel(channelId, inviteCode)
      return unwrapApiData(res)
    },
    onSuccess: () => {
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
