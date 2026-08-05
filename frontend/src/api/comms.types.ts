import type { User } from '../types'

export type ChannelKind = 'group' | 'direct'
export type RoomVisibility = 'public' | 'private' | 'unknown'
export type CallStatus =
  | 'ringing'
  | 'active'
  | 'rejected'
  | 'ended'
  | 'missed'
  | 'timeout'
  | 'unknown'

export interface Channel {
  id: string
  name: string
  createdBy: string
  visibility: string
  kind: ChannelKind
  inviteCode: string
  voiceRoomId?: string | null
  memberCount: number
  createdAt: string
}

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  body: string
  createdAt: string
  sender?: User
}

export interface LiveKitCredentials {
  url: string
  token: string
  roomName: string
}

export interface VoiceRoom {
  id: string
  name: string
  createdBy: string
  visibility: RoomVisibility
  kind: ChannelKind
  inviteCode: string
  maxParticipants: number
  memberCount: number
  createdAt: string
}

export interface RoomSession {
  room: VoiceRoom
  livekit: LiveKitCredentials
}

export interface Call {
  id: string
  room: VoiceRoom
  status: CallStatus
  callerId: string
  calleeIds: string[]
  inviteCode: string
  createdAt: string
  ringingExpiresAt?: string | null
}

export interface CallSession {
  call: Call
  room: VoiceRoom
  livekit?: LiveKitCredentials | null
}

export interface CreateChannelRequest {
  name: string
  visibility: 'public' | 'private'
  voiceRoomId?: string | null
}

export interface CreateDirectChannelRequest {
  peerUserId: string
}

export interface SendMessageRequest {
  body: string
}

export interface CreateVoiceRoomRequest {
  name: string
  visibility: 'public' | 'private'
  kind?: ChannelKind
  maxParticipants?: number
}

export interface StartDirectCallRequest {
  peerUserId: string
}

export interface StartGroupCallRequest {
  name: string
  peerUserIds?: string[]
}

export interface RespondCallRequest {
  accept: boolean
}

/** Server → client WS envelope */
export type GatewayEventType =
  | 'connected'
  | 'pong'
  | 'subscribed'
  | 'unsubscribed'
  | 'subscribed_voice'
  | 'unsubscribed_voice'
  | 'error'
  | 'chat.message'
  | 'voice.call_incoming'
  | 'voice.call_accepted'
  | 'voice.call_rejected'
  | 'voice.call_ended'
  | 'voice.call_timeout'
  | 'voice.call_missed'
  | 'voice.member_joined'
  | 'voice.member_left'
  | 'voice.signal'

export interface GatewayEvent<T = unknown> {
  type: GatewayEventType | string
  data?: T
}
