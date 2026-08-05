import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../api/comms.types'
import type { User } from '../../types'

interface MessagePanelProps {
  messages: ChatMessage[]
  currentUser: User | null
  loading?: boolean
  emptyHint?: string
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function sameDay(a: string, b: string) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (sameDay(iso, today.toISOString())) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (sameDay(iso, yesterday.toISOString())) return 'Yesterday'
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function MessagePanel({
  messages,
  currentUser,
  loading,
  emptyHint = 'No messages yet — say hello',
}: MessagePanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
        Loading messages…
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-500 px-6 text-center">
        {emptyHint}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {messages.map((msg, i) => {
        const prev = messages[i - 1]
        const showDay = !prev || !sameDay(prev.createdAt, msg.createdAt)
        const isMine = msg.senderId === currentUser?.id
        const name = msg.sender?.name ?? (isMine ? currentUser?.name : msg.senderId.slice(0, 8))
        const initial = (name ?? '?').charAt(0).toUpperCase()

        return (
          <div key={msg.id}>
            {showDay && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  {dayLabel(msg.createdAt)}
                </span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
            )}
            <div
              className={`group flex items-end gap-2 px-2 py-1 ${
                isMine ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold shrink-0 overflow-hidden">
                  {msg.sender?.profileImage ? (
                    <img
                      src={msg.sender.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </div>
              )}
              <div
                className={`max-w-[78%] sm:max-w-[68%] rounded-2xl px-3.5 py-2 shadow-sm ${
                  isMine
                    ? 'rounded-br-sm bg-accent text-white'
                    : 'rounded-bl-sm bg-surface-overlay border border-border-subtle text-slate-200'
                }`}
              >
                {!isMine && (
                  <p className="mb-0.5 text-xs font-semibold text-accent truncate">
                    {name}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <p className="min-w-0 text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.body}
                  </p>
                  <span
                    className={`shrink-0 text-[9px] tabular-nums ${
                      isMine ? 'text-white/70' : 'text-slate-500'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
