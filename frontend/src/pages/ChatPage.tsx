import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Hash, Phone, Copy, Check } from 'lucide-react'
import { useAppSelector } from '../store/hooks'
import { useAuth } from '../hooks/useAuth'
import { useGatewaySocket } from '../hooks/useGatewaySocket'
import { useLiveKitRoom } from '../hooks/useLiveKitRoom'
import {
  useChannels,
  useChannelMessages,
  useCreateChannel,
  useCreateDirectChannel,
  useJoinChannel,
  useSendMessage,
  appendChannelMessage,
  useVoiceRooms,
  useCreateVoiceRoom,
  useJoinVoiceRoom,
  useStartDirectCall,
  useRespondCall,
  useEndCall,
  useLeaveVoiceRoom,
} from '../hooks/api'
import { getApiErrorMessage } from '../api/client'
import type {
  Call,
  CallSession,
  ChatMessage,
  GatewayEvent,
  LiveKitCredentials,
} from '../api/comms.types'
import { ChannelSidebar } from '../components/comms/ChannelSidebar'
import { MessagePanel } from '../components/comms/MessagePanel'
import { MessageComposer } from '../components/comms/MessageComposer'
import { IncomingCallModal } from '../components/comms/IncomingCallModal'
import { ActiveCallBar } from '../components/comms/ActiveCallBar'
import {
  JoinByIdModal,
  NewChannelModal,
  NewDmModal,
  NewRoomModal,
  StartCallModal,
  ContactsModal,
} from '../components/comms/CommsModals'
import { Button } from '../components/ui/Button'

type ActiveSession = {
  kind: 'call' | 'room'
  roomId: string
  title: string
  status: string
}

export function ChatPage() {
  const { user } = useAuth()
  const token = useAppSelector((s) => s.auth.token)
  const qc = useQueryClient()

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [modal, setModal] = useState<
    | null
    | 'channel'
    | 'dm'
    | 'join-channel'
    | 'room'
    | 'join-room'
    | 'call'
    | 'contacts'
  >(null)

  const channelsQuery = useChannels({ limit: 50 })
  const roomsQuery = useVoiceRooms({ limit: 50 })
  const messagesQuery = useChannelMessages(selectedChannelId)
  const sendMessage = useSendMessage(selectedChannelId)
  const createChannel = useCreateChannel()
  const createDm = useCreateDirectChannel()
  const joinChannel = useJoinChannel()
  const createRoom = useCreateVoiceRoom()
  const joinRoom = useJoinVoiceRoom()
  const startDirectCall = useStartDirectCall()
  const respondCall = useRespondCall()
  const endCall = useEndCall()
  const leaveRoom = useLeaveVoiceRoom()
  const livekit = useLiveKitRoom()

  const channels = channelsQuery.data ?? []
  const rooms = roomsQuery.data ?? []
  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null

  useEffect(() => {
    if (!selectedChannelId && channelsQuery.data && channelsQuery.data.length > 0) {
      setSelectedChannelId(channelsQuery.data[0].id)
    }
  }, [channelsQuery.data, selectedChannelId])

  const beginLiveSession = useCallback(
    async (
      session: ActiveSession,
      creds?: LiveKitCredentials | null,
    ) => {
      setActiveSession(session)
      if (creds?.url && creds.token) {
        await livekit.connect(creds)
      }
    },
    [livekit],
  )

  const hangUp = useCallback(async () => {
    const session = activeSession
    setActiveSession(null)
    await livekit.disconnect()
    if (!session) return
    try {
      if (session.kind === 'call') {
        await endCall.mutateAsync(session.roomId)
      } else {
        await leaveRoom.mutateAsync(session.roomId)
      }
    } catch {
      // hangup best-effort
    }
  }, [activeSession, endCall, leaveRoom, livekit])

  const onGatewayEvent = useCallback(
    (event: GatewayEvent) => {
      switch (event.type) {
        case 'chat.message': {
          const raw = event.data as ChatMessage | { message?: ChatMessage }
          const msg =
            raw && typeof raw === 'object' && 'id' in raw && 'channelId' in raw
              ? (raw as ChatMessage)
              : (raw as { message?: ChatMessage })?.message
          if (msg?.channelId && msg?.id) {
            appendChannelMessage(qc, msg)
          }
          break
        }
        case 'voice.call_incoming': {
          const payload = event.data as Call | CallSession
          const call = 'call' in (payload as CallSession)
            ? (payload as CallSession).call
            : (payload as Call)
          if (call?.id && call.callerId !== user?.id) {
            setIncomingCall(call)
          }
          break
        }
        case 'voice.call_accepted': {
          setBanner('Call accepted')
          break
        }
        case 'voice.call_rejected':
        case 'voice.call_missed':
        case 'voice.call_timeout': {
          setBanner('Call not answered')
          void livekit.disconnect()
          setActiveSession(null)
          break
        }
        case 'voice.call_ended': {
          setBanner('Call ended')
          void livekit.disconnect()
          setActiveSession(null)
          setIncomingCall(null)
          break
        }
        case 'error': {
          const data = event.data as { message?: string } | string | undefined
          const message =
            typeof data === 'string'
              ? data
              : data?.message ?? 'Gateway error'
          setBanner(message)
          break
        }
        default:
          break
      }
    },
    [livekit, qc, user?.id],
  )

  const socket = useGatewaySocket({
    token,
    enabled: !!token,
    onEvent: onGatewayEvent,
  })

  useEffect(() => {
    const list = channelsQuery.data
    if (!socket.connected || !list?.length) return
    for (const channel of list) {
      socket.subscribeChannel(channel.id)
    }
  }, [socket.connected, channelsQuery.data, socket.subscribeChannel])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(t)
  }, [banner])

  async function handleSend(body: string) {
    if (!selectedChannelId) return
    try {
      // Always REST: persists + gateway broadcasts `chat.message` on WS.
      // Local cache updates in useSendMessage.onSuccess (no refresh needed).
      // Receiving clients still need a stable WS + channel subscribe.
      await sendMessage.mutateAsync(body)
    } catch (err) {
      setBanner(getApiErrorMessage(err))
    }
  }

  async function handleAcceptCall() {
    if (!incomingCall?.room?.id) return
    try {
      const session = await respondCall.mutateAsync({
        roomId: incomingCall.room.id,
        accept: true,
      })
      setIncomingCall(null)
      await beginLiveSession(
        {
          kind: 'call',
          roomId: session.room.id,
          title: session.room.name || 'Voice call',
          status: 'Connected',
        },
        session.livekit,
      )
      socket.subscribeVoice(session.room.id)
    } catch (err) {
      setBanner(getApiErrorMessage(err))
    }
  }

  async function handleRejectCall() {
    if (!incomingCall?.room?.id) return
    try {
      await respondCall.mutateAsync({
        roomId: incomingCall.room.id,
        accept: false,
      })
    } catch {
      // ignore
    } finally {
      setIncomingCall(null)
    }
  }

  async function connectRoomSession(
    roomId: string,
    title: string,
    creds?: LiveKitCredentials | null,
  ) {
    setSelectedRoomId(roomId)
    await beginLiveSession(
      { kind: 'room', roomId, title, status: 'In voice room' },
      creds,
    )
    socket.subscribeVoice(roomId)
  }

  async function handleSelectRoom(roomId: string) {
    try {
      const session = await joinRoom.mutateAsync({ roomId })
      await connectRoomSession(session.room.id, session.room.name, session.livekit)
    } catch (err) {
      setBanner(getApiErrorMessage(err))
    }
  }

  function copyInvite() {
    if (!selectedChannel?.inviteCode) return
    void navigator.clipboard.writeText(selectedChannel.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="-m-4 lg:-m-8 flex-1 min-h-0 flex overflow-hidden rounded-none border-0">
      <div className="flex flex-1 min-h-0 bg-surface border border-border-subtle rounded-none lg:rounded-2xl overflow-hidden shadow-xl">
        <ChannelSidebar
          channels={channels}
          rooms={rooms}
          selectedChannelId={selectedChannelId}
          selectedRoomId={selectedRoomId}
          wsConnected={socket.connected}
          onSelectChannel={(id) => {
            setSelectedChannelId(id)
            setSelectedRoomId(null)
          }}
          onSelectRoom={(id) => void handleSelectRoom(id)}
          onNewChannel={() => setModal('channel')}
          onNewDm={() => setModal('dm')}
          onJoinChannel={() => setModal('join-channel')}
          onNewRoom={() => setModal('room')}
          onJoinRoom={() => setModal('join-room')}
          onOpenContacts={() => setModal('contacts')}
        />

        <section className="flex-1 min-w-0 flex flex-col bg-surface">
          {activeSession && (
            <ActiveCallBar
              title={activeSession.title}
              statusLabel={
                livekit.connecting
                  ? 'Connecting audio…'
                  : livekit.connected
                    ? `${activeSession.status} · ${livekit.participants.length} in call`
                    : activeSession.status
              }
              muted={livekit.muted}
              participants={livekit.participants}
              onToggleMute={() => void livekit.toggleMute()}
              onHangUp={() => void hangUp()}
            />
          )}

          {banner && (
            <div className="px-4 py-2 text-xs text-center bg-surface-overlay text-slate-300 border-b border-border-subtle">
              {banner}
            </div>
          )}

          {selectedChannel ? (
            <>
              <header className="h-14 shrink-0 px-4 flex items-center gap-3 border-b border-border-subtle bg-surface-raised/50">
                <Hash className="w-5 h-5 text-slate-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedChannel.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {selectedChannel.kind} · {selectedChannel.visibility} ·{' '}
                    {selectedChannel.memberCount} members
                  </p>
                </div>
                {selectedChannel.inviteCode && (
                  <button
                    type="button"
                    onClick={copyInvite}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-surface-overlay cursor-pointer"
                    title="Copy invite code"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {selectedChannel.inviteCode}
                  </button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setModal('call')}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </Button>
              </header>

              <MessagePanel
                messages={messagesQuery.data ?? []}
                currentUser={user}
                loading={messagesQuery.isLoading}
              />

              <MessageComposer
                disabled={!selectedChannelId}
                sending={sendMessage.isPending}
                placeholder={`Message #${selectedChannel.name}`}
                onSend={handleSend}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Hash className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Your chats & calls
              </h2>
              <p className="text-sm text-slate-400 max-w-sm">
                Create a channel, open a DM, or jump into a voice room. WebSocket
                connects only while you&apos;re here — matching the gateway API.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Button size="sm" onClick={() => setModal('channel')}>
                  New channel
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setModal('dm')}>
                  New DM
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setModal('room')}>
                  Voice room
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <IncomingCallModal
        call={incomingCall}
        busy={respondCall.isPending}
        onAccept={() => void handleAcceptCall()}
        onReject={() => void handleRejectCall()}
      />

      <NewChannelModal
        open={modal === 'channel'}
        onClose={() => setModal(null)}
        onSubmit={async (data) => {
          const channel = await createChannel.mutateAsync(data)
          setSelectedChannelId(channel.id)
        }}
      />

      <NewDmModal
        open={modal === 'dm'}
        onClose={() => setModal(null)}
        onSubmit={async (peerUserId) => {
          const channel = await createDm.mutateAsync({ peerUserId })
          setSelectedChannelId(channel.id)
        }}
      />

      <JoinByIdModal
        open={modal === 'join-channel'}
        onClose={() => setModal(null)}
        title="Join channel"
        idLabel="Channel ID"
        onSubmit={async (channelId, inviteCode) => {
          const channel = await joinChannel.mutateAsync({ channelId, inviteCode })
          setSelectedChannelId(channel.id)
        }}
      />

      <NewRoomModal
        open={modal === 'room'}
        onClose={() => setModal(null)}
        onSubmit={async (data) => {
          const session = await createRoom.mutateAsync({
            ...data,
            kind: 'group',
          })
          await connectRoomSession(
            session.room.id,
            session.room.name,
            session.livekit,
          )
        }}
      />

      <JoinByIdModal
        open={modal === 'join-room'}
        onClose={() => setModal(null)}
        title="Join voice room"
        idLabel="Room ID"
        onSubmit={async (roomId, inviteCode) => {
          const session = await joinRoom.mutateAsync({ roomId, inviteCode })
          await connectRoomSession(
            session.room.id,
            session.room.name,
            session.livekit,
          )
        }}
      />

      <StartCallModal
        open={modal === 'call'}
        onClose={() => setModal(null)}
        onSubmit={async (peerUserId) => {
          const session = await startDirectCall.mutateAsync({ peerUserId })
          await beginLiveSession(
            {
              kind: 'call',
              roomId: session.room.id,
              title: session.room.name || 'Direct call',
              status: 'Ringing…',
            },
            session.livekit,
          )
          socket.subscribeVoice(session.room.id)
          setBanner('Calling… waiting for answer')
        }}
      />

      <ContactsModal
        open={modal === 'contacts'}
        onClose={() => setModal(null)}
        onMessage={async (peer) => {
          const channel = await createDm.mutateAsync({ peerUserId: peer.id })
          setSelectedChannelId(channel.id)
        }}
      />
    </div>
  )
}
