import { createPortal } from 'react-dom'
import { Phone, PhoneOff } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Call } from '../../api/comms.types'

interface IncomingCallModalProps {
  call: Call | null
  busy?: boolean
  onAccept: () => void
  onReject: () => void
}

export function IncomingCallModal({
  call,
  busy,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  if (!call) return null

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-3xl bg-surface-raised border border-border p-8 text-center shadow-2xl animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mb-4 animate-pulse">
          <Phone className="w-7 h-7 text-accent" />
        </div>
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
          Incoming call
        </p>
        <h2 className="text-xl font-semibold text-white mb-1">
          {call.room?.name || 'Voice call'}
        </h2>
        <p className="text-sm text-slate-400 mb-8 truncate">
          From {call.callerId.slice(0, 8)}…
        </p>
        <div className="flex gap-3 justify-center">
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
            Accept
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
