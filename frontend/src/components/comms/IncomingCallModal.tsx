import { createPortal } from 'react-dom'
import { Phone, PhoneOff } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Call } from '../../api/comms.types'

interface IncomingCallModalProps {
  call: Call | null
  callerName?: string
  busy?: boolean
  onAccept: () => void
  onReject: () => void
  onLater?: () => void
}

export function IncomingCallModal({
  call,
  callerName,
  busy,
  onAccept,
  onReject,
  onLater,
}: IncomingCallModalProps) {
  if (!call) return null

  const title = callerName || call.room?.name || 'Voice call'

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-3xl bg-surface-raised border border-border p-8 text-center shadow-2xl animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mb-4 animate-pulse">
          <Phone className="w-7 h-7 text-accent" />
        </div>
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
          Incoming voice call
        </p>
        <h2 className="text-xl font-semibold text-white mb-1 truncate">{title}</h2>
        <p className="text-sm text-slate-400 mb-8">
          Join to talk, or decline to end the call.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            variant="danger"
            onClick={onReject}
            disabled={busy}
            className="rounded-full px-6"
          >
            <PhoneOff className="w-4 h-4" />
            Decline
          </Button>
          <Button
            variant="primary"
            onClick={onAccept}
            loading={busy}
            className="rounded-full px-6"
          >
            <Phone className="w-4 h-4" />
            Join call
          </Button>
        </div>
        {onLater && (
          <button
            type="button"
            onClick={onLater}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            Maybe later — keep join option
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** Sticky bar while a call is ringing and user has not joined yet */
export function PendingCallBanner({
  callerName,
  busy,
  onJoin,
  onDecline,
}: {
  callerName: string
  busy?: boolean
  onJoin: () => void
  onDecline: () => void
}) {
  return (
    <div className="px-4 py-3 border-b border-accent/30 bg-accent/10 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {callerName} is calling
          </p>
          <p className="text-[11px] text-slate-400">
            Join to enter the voice room, or decline to end it
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="danger" disabled={busy} onClick={onDecline}>
          Decline
        </Button>
        <Button size="sm" loading={busy} onClick={onJoin}>
          <Phone className="w-3.5 h-3.5" />
          Join
        </Button>
      </div>
    </div>
  )
}
