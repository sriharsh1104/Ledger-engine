import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Hash,
  Phone,
  MessageCircle,
  Eraser,
  UserPlus,
  Users,
} from 'lucide-react'
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
  useJoinByInviteCode,
  useClearMessages,
  useSendMessage,
  appendChannelMessage,
  clearChannelMessages,
  removeMessagesBySender,
  removeChannelFromList,
  useVoiceRooms,
  useCreateVoiceRoom,
  useJoinVoiceRoom,
  useStartDirectCall,
  useRespondCall,
  useEndCall,
  useLeaveVoiceRoom,
  useContacts,
} from '../hooks/api'
import { getApiErrorMessage } from '../api/client'
import type {
  Call,
  CallSession,
  Channel,
  ChatClearedEvent,
  ChatMemberBlockedEvent,
  ChatMemberAddedEvent,
  ChatMemberRemovedEvent,
  ChatMemberRoleUpdatedEvent,
  ChatMessage,
  ChatUserMessagesDeletedEvent,
  GatewayEvent,
  LiveKitCredentials,
} from '../api/comms.types'
import type { User } from '../types'
import { peerFromMessages, resolvePeerLabel, looksLikeTruncatedId } from '../lib/displayName'
import { ChannelSidebar } from '../components/comms/ChannelSidebar'
import { MessagePanel } from '../components/comms/MessagePanel'
import { MessageComposer } from '../components/comms/MessageComposer'
import { IncomingCallModal, PendingCallBanner } from '../components/comms/IncomingCallModal'
import { ActiveCallBar } from '../components/comms/ActiveCallBar'
import {
  JoinByCodeModal,
  NewChannelModal,
  NewDmModal,
  NewRoomModal,
  ContactsModal,
  FindGroupModal,
} from '../components/comms/CommsModals'
import { GroupInviteModal } from '../components/comms/GroupInviteModal'
import { GroupMembersModal } from '../components/comms/GroupMembersModal'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/Modal'
import { queryKeys } from '../lib/queryKeys'

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
  const location = useLocation()
  const navigate = useNavigate()

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [incomingCaller, setIncomingCaller] = useState<User | null>(null)
  /** Keep join UI until accept/decline/end — even if modal is dismissed */
  const [showIncomingModal, setShowIncomingModal] = useState(true)
  const [callBusy, setCallBusy] = useState(false)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  /** channelId → peer user (for DM labels) */
  const [dmPeers, setDmPeers] = useState<Record<string, User>>({})
  const [confirmClear, setConfirmClear] = useState(false)

  const [modal, setModal] = useState<
    | null
    | 'channel'
    | 'dm'
    | 'find-groups'
    | 'join-channel'
    | 'room'
    | 'join-room'
    | 'contacts'
    | 'invite'
    | 'members'
  >(null)

  const channelsQuery = useChannels({ limit: 50 })
  const roomsQuery = useVoiceRooms({ limit: 50 })
  const contactsQuery = useContacts({ limit: 100 })
  const messagesQuery = useChannelMessages(selectedChannelId)
  const sendMessage = useSendMessage(selectedChannelId)
  const createChannel = useCreateChannel()
  const createDm = useCreateDirectChannel()
  const joinChannel = useJoinChannel()
  const joinByInvite = useJoinByInviteCode()
  const clearMessages = useClearMessages()
  const createRoom = useCreateVoiceRoom()
  const joinRoom = useJoinVoiceRoom()
  const startDirectCall = useStartDirectCall()
  const respondCall = useRespondCall()
  const endCall = useEndCall()
  const leaveRoom = useLeaveVoiceRoom()
  const livekit = useLiveKitRoom()

  const channels = channelsQuery.data ?? []
  const rooms = roomsQuery.data ?? []
  const contacts = contactsQuery.data ?? []
  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null
  const selectedMessages = messagesQuery.data ?? []

  const rememberDmPeer = useCallback((channelId: string, peer: User) => {
    setDmPeers((prev) => {
      const existing = prev[channelId]
      if (!existing) return { ...prev, [channelId]: peer }
      if (existing.id === peer.id && existing.name === peer.name) return prev
      // Don't overwrite a real username with an empty / truncated-id placeholder
      const existingOk = !looksLikeTruncatedId(existing.name, existing.id)
      const incomingOk = !looksLikeTruncatedId(peer.name, peer.id)
      if (existingOk && !incomingOk && existing.id === peer.id) return prev
      return { ...prev, [channelId]: peer }
    })
  }, [])

  // Learn DM peer from loaded messages
  useEffect(() => {
    if (!selectedChannel || selectedChannel.kind !== 'direct') return
    const peer = peerFromMessages(selectedMessages, user?.id)
    if (peer) rememberDmPeer(selectedChannel.id, peer)
  }, [selectedChannel, selectedMessages, user?.id, rememberDmPeer])

  const channelLabel = useCallback(
    (channel: Channel) => {
      if (channel.kind !== 'direct') return channel.name
      const peer = dmPeers[channel.id]
      if (peer) return resolvePeerLabel(peer, contacts).title
      if (channel.name && channel.name !== 'direct') return channel.name
      return 'Direct message'
    },
    [contacts, dmPeers],
  )

  const selectedTitle = useMemo(() => {
    if (!selectedChannel) return ''
    return channelLabel(selectedChannel)
  }, [selectedChannel, channelLabel])

  const selectedPeerMeta = useMemo(() => {
    if (!selectedChannel || selectedChannel.kind !== 'direct') return null
    const peer = dmPeers[selectedChannel.id]
    if (!peer) return null
    return resolvePeerLabel(peer, contacts)
  }, [selectedChannel, dmPeers, contacts])

  const selectedPeer = selectedChannel?.kind === 'direct'
    ? dmPeers[selectedChannel.id] ?? null
    : null

  const incomingCallerName = useMemo(() => {
    if (!incomingCall) return 'Someone'
    const callerId = incomingCall.callerId
    const fromDm = Object.values(dmPeers).find((p) => p.id === callerId)
    const fromContacts = contacts.find((c) => c.id === callerId)
    const known =
      fromContacts || incomingCaller || fromDm || null
    return resolvePeerLabel(
      known ?? {
        id: callerId,
        name: '',
        email: '',
      },
      contacts,
    ).title
  }, [incomingCall, incomingCaller, dmPeers, contacts])

  useEffect(() => {
    if (!selectedChannelId && channelsQuery.data && channelsQuery.data.length > 0) {
      setSelectedChannelId(channelsQuery.data[0].id)
    }
  }, [channelsQuery.data, selectedChannelId])

  // Deep-link /invite/:code or Connect-sidebar contact → select channel
  useEffect(() => {
    const state = location.state as {
      selectChannelId?: string
      dmPeer?: User
    } | null
    if (state?.selectChannelId) {
      setSelectedChannelId(state.selectChannelId)
      if (state.dmPeer) rememberDmPeer(state.selectChannelId, state.dmPeer)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate, rememberDmPeer])

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
            if (
              msg.sender &&
              msg.senderId &&
              user?.id &&
              msg.senderId !== user.id
            ) {
              rememberDmPeer(msg.channelId, msg.sender)
            }
          }
          break
        }
        case 'chat.cleared': {
          const payload = event.data as ChatClearedEvent | undefined
          if (payload?.channelId) {
            clearChannelMessages(qc, payload.channelId)
            if (payload.channelId === selectedChannelId) {
              setBanner('Chat cleared')
            }
          }
          break
        }
        case 'chat.member_removed': {
          const payload = event.data as ChatMemberRemovedEvent | undefined
          if (!payload?.channelId) break
          void qc.invalidateQueries({
            queryKey: queryKeys.chat.members(payload.channelId),
          })
          void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
          if (payload.removedUserId === user?.id) {
            removeChannelFromList(qc, payload.channelId)
            if (selectedChannelId === payload.channelId) {
              setSelectedChannelId(null)
              setBanner('You were removed from the group')
            }
          } else if (payload.channelId === selectedChannelId) {
            setBanner('A member was removed')
          }
          break
        }
        case 'chat.member_added': {
          const payload = event.data as ChatMemberAddedEvent | undefined
          if (!payload?.channelId) break
          void qc.invalidateQueries({
            queryKey: queryKeys.chat.members(payload.channelId),
          })
          void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
          if (payload.addedUserId === user?.id) {
            setBanner('You were added to a group')
          } else if (payload.channelId === selectedChannelId) {
            setBanner('A member was added')
          }
          break
        }
        case 'chat.member_role_updated': {
          const payload = event.data as ChatMemberRoleUpdatedEvent | undefined
          if (!payload?.channelId) break
          void qc.invalidateQueries({
            queryKey: queryKeys.chat.members(payload.channelId),
          })
          if (payload.channelId === selectedChannelId) {
            setBanner(
              payload.userId === user?.id
                ? `Your role is now ${payload.role}`
                : 'Member role updated',
            )
          }
          break
        }
        case 'chat.user_messages_deleted': {
          const payload = event.data as ChatUserMessagesDeletedEvent | undefined
          if (!payload?.channelId || !payload.targetUserId) break
          removeMessagesBySender(qc, payload.channelId, payload.targetUserId)
          if (payload.channelId === selectedChannelId) {
            setBanner(
              `Removed ${payload.deletedCount ?? 0} messages from a member`,
            )
          }
          break
        }
        case 'chat.member_blocked': {
          const payload = event.data as ChatMemberBlockedEvent | undefined
          if (!payload?.channelId) break
          void qc.invalidateQueries({
            queryKey: queryKeys.chat.members(payload.channelId),
          })
          void qc.invalidateQueries({ queryKey: ['chat', 'channels'] })
          if (payload.blockedUserId === user?.id) {
            removeChannelFromList(qc, payload.channelId)
            if (selectedChannelId === payload.channelId) {
              setSelectedChannelId(null)
              setBanner('You were blocked from this group')
            }
          } else if (payload.channelId === selectedChannelId) {
            setBanner('A member was blocked')
          }
          break
        }
        case 'voice.call_incoming': {
          type IncomingPayload = {
            callId?: string
            roomId?: string
            callerId?: string
            caller?: User
            inviteCode?: string
            kind?: 'direct' | 'group'
            ringingExpiresAt?: string
          }
          const payload = event.data as Call | CallSession | IncomingPayload
          let call: Call | null = null

          if ('call' in (payload as CallSession)) {
            call = (payload as CallSession).call
          } else if ('callId' in (payload as IncomingPayload)) {
            const incoming = payload as IncomingPayload
            if (incoming.callId && incoming.roomId && incoming.callerId) {
              call = {
                id: incoming.callId,
                callerId: incoming.callerId,
                calleeIds: user?.id ? [user.id] : [],
                inviteCode: incoming.inviteCode ?? '',
                status: 'ringing',
                createdAt: new Date().toISOString(),
                ringingExpiresAt: incoming.ringingExpiresAt,
                room: {
                  id: incoming.roomId,
                  name: 'Direct call',
                  createdBy: incoming.callerId,
                  visibility: 'private',
                  kind: incoming.kind ?? 'direct',
                  inviteCode: incoming.inviteCode ?? '',
                  maxParticipants: 2,
                  memberCount: 1,
                  hasPassword: false,
                  createdAt: new Date().toISOString(),
                },
              }
              if (incoming.caller) {
                setIncomingCaller(incoming.caller)
                const matchingDm = channels.find(
                  (channel) =>
                    channel.kind === 'direct' &&
                    dmPeers[channel.id]?.id === incoming.callerId,
                )
                if (matchingDm) {
                  rememberDmPeer(matchingDm.id, incoming.caller)
                }
              }
            }
          } else {
            call = payload as Call
          }

          if (call?.id && call.callerId !== user?.id) {
            setIncomingCall(call)
            setShowIncomingModal(true)
          }
          break
        }
        case 'voice.call_accepted': {
          setBanner('Call accepted — they’re in the voice room')
          if (activeSession?.kind === 'call') {
            setActiveSession((prev) =>
              prev ? { ...prev, status: 'Connected' } : prev,
            )
          }
          break
        }
        case 'voice.call_rejected':
        case 'voice.call_missed':
        case 'voice.call_timeout': {
          setBanner(
            event.type === 'voice.call_rejected'
              ? 'Call declined'
              : 'Call not answered',
          )
          setIncomingCall(null)
          setIncomingCaller(null)
          setShowIncomingModal(false)

          // Decline / miss / timeout ends the ringing call for everyone
          const roomId =
            activeSession?.kind === 'call'
              ? activeSession.roomId
              : ((event.data as { roomId?: string } | undefined)?.roomId ?? null)
          void (async () => {
            try {
              if (roomId && activeSession?.kind === 'call') {
                await endCall.mutateAsync(roomId)
              }
            } catch {
              // best-effort — already rejected on backend
            } finally {
              await livekit.disconnect()
              setActiveSession(null)
            }
          })()
          break
        }
        case 'voice.call_ended': {
          setBanner('Call ended')
          void livekit.disconnect()
          setActiveSession(null)
          setIncomingCall(null)
          setIncomingCaller(null)
          setShowIncomingModal(false)
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
    [
      livekit,
      qc,
      user?.id,
      rememberDmPeer,
      activeSession,
      channels,
      dmPeers,
      endCall,
      selectedChannelId,
    ],
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

  async function handleSendMedia(file: File, caption: string) {
    // The gateway currently accepts only JSON `{ body }`; it has no upload or
    // attachment endpoint. Keep the selected file in the composer and explain
    // what is missing instead of pretending a local blob URL is shareable.
    const kind = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'audio'
    setBanner(
      `${kind} selected${caption ? ' with caption' : ''}, but media upload is not available on the backend yet`,
    )
    throw new Error('Media upload endpoint is not available')
  }

  async function handleStartDmCall() {
    if (!selectedPeer?.id) {
      setBanner('Open a chat message first so we know who to call')
      return
    }
    if (activeSession) {
      setBanner('Already in a call — hang up first')
      return
    }
    setCallBusy(true)
    try {
      const session = await startDirectCall.mutateAsync({
        peerUserId: selectedPeer.id,
      })
      const peerLabel = resolvePeerLabel(selectedPeer, contacts).title
      await beginLiveSession(
        {
          kind: 'call',
          roomId: session.room.id,
          title: `Call with ${peerLabel}`,
          status: 'Ringing… waiting for them to join',
        },
        session.livekit,
      )
      socket.subscribeVoice(session.room.id)
      setBanner(`Calling ${peerLabel}… join option is open on their side`)
    } catch (err) {
      setBanner(getApiErrorMessage(err))
    } finally {
      setCallBusy(false)
    }
  }

  async function handleAcceptCall() {
    if (!incomingCall?.room?.id) return
    setCallBusy(true)
    try {
      const session = await respondCall.mutateAsync({
        roomId: incomingCall.room.id,
        accept: true,
      })
      setIncomingCall(null)
      setIncomingCaller(null)
      setShowIncomingModal(false)
      await beginLiveSession(
        {
          kind: 'call',
          roomId: session.room.id,
          title: `Call with ${incomingCallerName}`,
          status: 'Connected',
        },
        session.livekit,
      )
      socket.subscribeVoice(session.room.id)
    } catch (err) {
      setBanner(getApiErrorMessage(err))
    } finally {
      setCallBusy(false)
    }
  }

  async function handleRejectCall() {
    if (!incomingCall?.room?.id) return
    setCallBusy(true)
    try {
      await respondCall.mutateAsync({
        roomId: incomingCall.room.id,
        accept: false,
      })
      setBanner('Call declined')
    } catch (err) {
      setBanner(getApiErrorMessage(err))
    } finally {
      setIncomingCall(null)
      setIncomingCaller(null)
      setShowIncomingModal(false)
      setCallBusy(false)
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

  return (
    <div className="absolute inset-0 flex overflow-hidden rounded-none border-0">
      <div className="flex flex-1 min-h-0 bg-surface border border-border-subtle rounded-none lg:rounded-2xl overflow-hidden shadow-xl">
        <ChannelSidebar
          channels={channels}
          rooms={rooms}
          selectedChannelId={selectedChannelId}
          selectedRoomId={selectedRoomId}
          wsConnected={socket.connected}
          channelLabel={channelLabel}
          onSelectChannel={(id) => {
            setSelectedChannelId(id)
            setSelectedRoomId(null)
          }}
          onSelectRoom={(id) => void handleSelectRoom(id)}
          onNewChannel={() => setModal('channel')}
          onNewDm={() => setModal('dm')}
          onFindGroups={() => setModal('find-groups')}
          onJoinPrivateChannel={() => setModal('join-channel')}
          onNewRoom={() => setModal('room')}
          onJoinPrivateRoom={() => setModal('join-room')}
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

          {!activeSession && incomingCall && !showIncomingModal && (
            <PendingCallBanner
              callerName={incomingCallerName}
              busy={callBusy}
              onJoin={() => void handleAcceptCall()}
              onDecline={() => void handleRejectCall()}
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
                {selectedChannel.kind === 'direct' ? (
                  <MessageCircle className="w-5 h-5 text-slate-500" />
                ) : (
                  <Hash className="w-5 h-5 text-slate-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {selectedTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {selectedChannel.kind === 'direct'
                      ? selectedPeerMeta?.isContact
                        ? 'Contact'
                        : 'Username'
                      : `${selectedChannel.kind} · ${selectedChannel.visibility} · ${selectedChannel.memberCount} members`}
                  </p>
                </div>
                {selectedChannel.kind === 'direct' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={callBusy && !incomingCall}
                    disabled={!!activeSession || !selectedPeer}
                    onClick={() => void handleStartDmCall()}
                    title={
                      selectedPeer
                        ? `Call ${resolvePeerLabel(selectedPeer, contacts).title}`
                        : 'Need a chat message to identify peer'
                    }
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </Button>
                )}
                {selectedChannel.kind !== 'direct' && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setModal('members')}
                      title="Members & roles"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Members</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setModal('invite')}
                      title="Invite people"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Invite</span>
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  loading={clearMessages.isPending}
                  disabled={!selectedMessages.length}
                  onClick={() => setConfirmClear(true)}
                  title="Clear chat"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </header>

              <MessagePanel
                messages={selectedMessages}
                currentUser={user}
                contacts={contacts}
                loading={messagesQuery.isLoading}
              />

              <MessageComposer
                disabled={!selectedChannelId}
                sending={sendMessage.isPending}
                placeholder={
                  selectedChannel.kind === 'direct'
                    ? `Message ${selectedTitle}`
                    : `Message #${selectedChannel.name}`
                }
                onSend={handleSend}
                onSendMedia={handleSendMedia}
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
                  New group
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setModal('find-groups')}>
                  Find groups
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
        call={showIncomingModal ? incomingCall : null}
        callerName={incomingCallerName}
        busy={callBusy}
        onAccept={() => void handleAcceptCall()}
        onReject={() => void handleRejectCall()}
        onLater={() => setShowIncomingModal(false)}
      />

      <NewChannelModal
        open={modal === 'channel'}
        onClose={() => setModal(null)}
        onSubmit={async (data) => {
          const channel = await createChannel.mutateAsync(data)
          setSelectedChannelId(channel.id)
          if (channel.inviteCode) {
            setBanner(
              `Group created · invite code ${channel.inviteCode}` +
                (data.visibility === 'private' ? ' (share code + password)' : ''),
            )
          }
        }}
      />

      <FindGroupModal
        open={modal === 'find-groups'}
        onClose={() => setModal(null)}
        onJoin={async (channel) => {
          const joined = await joinChannel.mutateAsync({
            channelId: channel.id,
            inviteCode: channel.inviteCode || '',
          })
          setSelectedChannelId(joined.id)
          setBanner(`Joined #${joined.name}`)
        }}
      />

      <NewDmModal
        open={modal === 'dm'}
        onClose={() => setModal(null)}
        onSubmit={async (peer) => {
          const channel = await createDm.mutateAsync({ peerUserId: peer.id })
          rememberDmPeer(channel.id, peer)
          setSelectedChannelId(channel.id)
        }}
      />

      <JoinByCodeModal
        open={modal === 'join-channel'}
        onClose={() => setModal(null)}
        title="Join group with invite code"
        showIdField={false}
        codeLabel="Invite code"
        onSubmit={async ({ inviteCode }) => {
          const channel = await joinByInvite.mutateAsync(inviteCode)
          setSelectedChannelId(channel.id)
          setBanner(`Joined #${channel.name}`)
        }}
      />

      <GroupInviteModal
        open={modal === 'invite'}
        onClose={() => setModal(null)}
        channelId={
          selectedChannel?.kind !== 'direct' ? selectedChannelId : null
        }
        channelName={selectedChannel?.kind !== 'direct' ? selectedChannel?.name : undefined}
      />

      <GroupMembersModal
        open={modal === 'members'}
        onClose={() => setModal(null)}
        channelId={
          selectedChannel?.kind !== 'direct' ? selectedChannelId : null
        }
        channelName={
          selectedChannel?.kind !== 'direct' ? selectedChannel?.name : undefined
        }
        currentUserId={user?.id}
        contacts={contacts}
        onBanner={setBanner}
      />

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear chat?"
        message={
          selectedChannel?.kind === 'direct'
            ? 'This deletes all messages in this chat for everyone. Membership stays the same.'
            : 'This deletes all messages in this group for everyone. Membership stays the same.'
        }
        confirmLabel="Clear chat"
        cancelLabel="Cancel"
        onConfirm={() => {
          void (async () => {
            if (!selectedChannelId) return
            try {
              await clearMessages.mutateAsync(selectedChannelId)
              setBanner('Chat cleared')
            } catch (err) {
              setBanner(getApiErrorMessage(err))
            } finally {
              setConfirmClear(false)
            }
          })()
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
          if (session.room.inviteCode) {
            setBanner(
              `Voice room ready · code ${session.room.inviteCode}` +
                (data.visibility === 'private' ? ' + password required to join' : ''),
            )
          }
        }}
      />

      <JoinByCodeModal
        open={modal === 'join-room'}
        onClose={() => setModal(null)}
        title="Join private voice room"
        idLabel="Room ID"
        codeLabel="Invite code"
        requirePassword
        onSubmit={async ({ id, inviteCode, password }) => {
          const session = await joinRoom.mutateAsync({
            roomId: id,
            inviteCode,
            password,
          })
          await connectRoomSession(
            session.room.id,
            session.room.name,
            session.livekit,
          )
        }}
      />

      <ContactsModal
        open={modal === 'contacts'}
        onClose={() => setModal(null)}
        onMessage={async (peer) => {
          const channel = await createDm.mutateAsync({ peerUserId: peer.id })
          rememberDmPeer(channel.id, peer)
          setSelectedChannelId(channel.id)
        }}
      />
    </div>
  )
}
