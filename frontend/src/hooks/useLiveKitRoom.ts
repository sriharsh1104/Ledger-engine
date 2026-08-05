import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type RemoteTrackPublication,
} from 'livekit-client'
import type { LiveKitCredentials } from '../api/comms.types'

export interface VoiceParticipant {
  identity: string
  name: string
  isSpeaking: boolean
  isMuted: boolean
  isLocal: boolean
}

interface UseLiveKitRoomResult {
  connected: boolean
  connecting: boolean
  muted: boolean
  participants: VoiceParticipant[]
  error: string | null
  connect: (creds: LiveKitCredentials) => Promise<void>
  disconnect: () => Promise<void>
  toggleMute: () => Promise<void>
}

function mapParticipants(room: Room): VoiceParticipant[] {
  const list: VoiceParticipant[] = []
  const local = room.localParticipant
  if (local) {
    const micPub = local.getTrackPublication(Track.Source.Microphone)
    list.push({
      identity: local.identity,
      name: local.name || local.identity,
      isSpeaking: local.isSpeaking,
      isMuted: !micPub || micPub.isMuted || !local.isMicrophoneEnabled,
      isLocal: true,
    })
  }
  room.remoteParticipants.forEach((p) => {
    const micPub = p.getTrackPublication(Track.Source.Microphone)
    list.push({
      identity: p.identity,
      name: p.name || p.identity,
      isSpeaking: p.isSpeaking,
      isMuted: !micPub || micPub.isMuted,
      isLocal: false,
    })
  })
  return list
}

export function useLiveKitRoom(): UseLiveKitRoomResult {
  const roomRef = useRef<Room | null>(null)
  const audioEls = useRef<Map<string, HTMLAudioElement>>(new Map())
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [muted, setMuted] = useState(false)
  const [participants, setParticipants] = useState<VoiceParticipant[]>([])
  const [error, setError] = useState<string | null>(null)

  const refreshParticipants = useCallback(() => {
    const room = roomRef.current
    if (!room) {
      setParticipants([])
      return
    }
    setParticipants(mapParticipants(room))
  }, [])

  const cleanupAudio = useCallback(() => {
    audioEls.current.forEach((el) => {
      el.pause()
      el.srcObject = null
      el.remove()
    })
    audioEls.current.clear()
  }, [])

  const attachTrack = useCallback(
    (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      const track = publication.track
      if (!track || publication.kind !== Track.Kind.Audio) return
      const key = `${participant.identity}:${publication.trackSid}`
      let el = audioEls.current.get(key)
      if (!el) {
        el = document.createElement('audio')
        el.autoplay = true
        el.setAttribute('playsinline', 'true')
        document.body.appendChild(el)
        audioEls.current.set(key, el)
      }
      track.attach(el)
    },
    [],
  )

  const disconnect = useCallback(async () => {
    const room = roomRef.current
    roomRef.current = null
    cleanupAudio()
    if (room) {
      room.removeAllListeners()
      await room.disconnect()
    }
    setConnected(false)
    setConnecting(false)
    setParticipants([])
    setMuted(false)
  }, [cleanupAudio])

  const connect = useCallback(
    async (creds: LiveKitCredentials) => {
      setError(null)
      setConnecting(true)
      await disconnect()

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      })
      roomRef.current = room

      room.on(RoomEvent.ParticipantConnected, refreshParticipants)
      room.on(RoomEvent.ParticipantDisconnected, refreshParticipants)
      room.on(RoomEvent.ActiveSpeakersChanged, refreshParticipants)
      room.on(RoomEvent.TrackMuted, refreshParticipants)
      room.on(RoomEvent.TrackUnmuted, refreshParticipants)
      room.on(RoomEvent.LocalTrackPublished, refreshParticipants)
      room.on(RoomEvent.LocalTrackUnpublished, refreshParticipants)
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          attachTrack(publication, participant)
        }
        refreshParticipants()
      })
      room.on(RoomEvent.TrackUnsubscribed, (_track, publication, participant) => {
        const key = `${participant.identity}:${publication.trackSid}`
        const el = audioEls.current.get(key)
        if (el) {
          el.pause()
          el.srcObject = null
          el.remove()
          audioEls.current.delete(key)
        }
        refreshParticipants()
      })
      room.on(RoomEvent.Disconnected, () => {
        cleanupAudio()
        setConnected(false)
        setParticipants([])
      })

      try {
        await room.connect(creds.url, creds.token)
        await room.localParticipant.setMicrophoneEnabled(true)
        setMuted(false)
        setConnected(true)
        refreshParticipants()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to connect voice'
        setError(message)
        await disconnect()
        throw err
      } finally {
        setConnecting(false)
      }
    },
    [attachTrack, cleanupAudio, disconnect, refreshParticipants],
  )

  const toggleMute = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    const next = !muted
    await room.localParticipant.setMicrophoneEnabled(!next)
    setMuted(next)
    refreshParticipants()
  }, [muted, refreshParticipants])

  useEffect(() => {
    return () => {
      void disconnect()
    }
  }, [disconnect])

  return {
    connected,
    connecting,
    muted,
    participants,
    error,
    connect,
    disconnect,
    toggleMute,
  }
}
