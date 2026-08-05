import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { config } from '../lib/config'
import type { GatewayEvent } from '../api/comms.types'

type EventHandler = (event: GatewayEvent) => void

interface UseGatewaySocketOptions {
  token: string | null
  enabled: boolean
  onEvent?: EventHandler
}

export function useGatewaySocket({
  token,
  enabled,
  onEvent,
}: UseGatewaySocketOptions) {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const onEventRef = useRef(onEvent)
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentionalClose = useRef(false)
  const channelSubs = useRef(new Set<string>())
  const voiceSubs = useRef(new Set<string>())
  const reconnectAttempt = useRef(0)
  const tokenRef = useRef(token)
  tokenRef.current = token

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const clearTimers = useCallback(() => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current)
      pingTimer.current = null
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  }, [])

  const sendRaw = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload))
      return true
    }
    return false
  }, [])

  const resubscribeAll = useCallback(() => {
    for (const channelId of channelSubs.current) {
      sendRaw({ type: 'subscribe', channelId })
    }
    for (const roomId of voiceSubs.current) {
      sendRaw({ type: 'subscribe_voice', roomId })
    }
  }, [sendRaw])

  const subscribeChannel = useCallback(
    (channelId: string) => {
      if (!channelId) return false
      channelSubs.current.add(channelId)
      return sendRaw({ type: 'subscribe', channelId })
    },
    [sendRaw],
  )

  const unsubscribeChannel = useCallback(
    (channelId: string) => {
      if (!channelId) return false
      channelSubs.current.delete(channelId)
      return sendRaw({ type: 'unsubscribe', channelId })
    },
    [sendRaw],
  )

  const subscribeVoice = useCallback(
    (roomId: string) => {
      if (!roomId) return false
      voiceSubs.current.add(roomId)
      return sendRaw({ type: 'subscribe_voice', roomId })
    },
    [sendRaw],
  )

  const unsubscribeVoice = useCallback(
    (roomId: string) => {
      if (!roomId) return false
      voiceSubs.current.delete(roomId)
      return sendRaw({ type: 'unsubscribe_voice', roomId })
    },
    [sendRaw],
  )

  const sendChat = useCallback(
    (channelId: string, body: string) =>
      sendRaw({ type: 'chat.send', channelId, body }),
    [sendRaw],
  )

  useEffect(() => {
    if (!enabled || !token) {
      intentionalClose.current = true
      clearTimers()
      wsRef.current?.close()
      wsRef.current = null
      setConnected(false)
      return
    }

    intentionalClose.current = false
    let cancelled = false

    function connect() {
      if (cancelled || intentionalClose.current) return

      const currentToken = tokenRef.current
      if (!currentToken) return

      const existing = wsRef.current
      if (
        existing &&
        (existing.readyState === WebSocket.OPEN ||
          existing.readyState === WebSocket.CONNECTING)
      ) {
        return
      }

      const url = `${config.wsUrl}?token=${encodeURIComponent(currentToken)}`
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (cancelled || wsRef.current !== ws) return
        reconnectAttempt.current = 0
        setConnected(true)
        // Re-subscribe after reconnect so messages keep flowing
        resubscribeAll()
        clearTimers()
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 25_000)
      }

      ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(String(ev.data)) as GatewayEvent
          onEventRef.current?.(parsed)
        } catch {
          // ignore malformed frames
        }
      }

      ws.onerror = () => {
        // onclose handles reconnect
      }

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null
        }
        setConnected(false)
        if (pingTimer.current) {
          clearInterval(pingTimer.current)
          pingTimer.current = null
        }
        if (intentionalClose.current || cancelled) return

        const attempt = reconnectAttempt.current++
        const delay = Math.min(1_000 * 2 ** attempt, 15_000)
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      cancelled = true
      intentionalClose.current = true
      clearTimers()
      const ws = wsRef.current
      wsRef.current = null
      ws?.close()
      setConnected(false)
    }
  }, [enabled, token, clearTimers, resubscribeAll])

  return useMemo(
    () => ({
      connected,
      subscribeChannel,
      unsubscribeChannel,
      subscribeVoice,
      unsubscribeVoice,
      sendChat,
    }),
    [
      connected,
      subscribeChannel,
      unsubscribeChannel,
      subscribeVoice,
      unsubscribeVoice,
      sendChat,
    ],
  )
}
