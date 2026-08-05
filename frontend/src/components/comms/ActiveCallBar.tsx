import { Mic, MicOff, PhoneOff } from 'lucide-react'
import type { VoiceParticipant } from '../../hooks/useLiveKitRoom'

interface ActiveCallBarProps {
  title: string
  statusLabel: string
  muted: boolean
  participants: VoiceParticipant[]
  onToggleMute: () => void
  onHangUp: () => void
}

export function ActiveCallBar({
  title,
  statusLabel,
  muted,
  participants,
  onToggleMute,
  onHangUp,
}: ActiveCallBarProps) {
  return (
    <div className="border-b border-accent/30 bg-accent-muted/40 px-4 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
            </span>
            <p className="text-sm font-semibold text-white truncate">{title}</p>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{statusLabel}</p>
        </div>

        <div className="flex -space-x-2">
          {participants.slice(0, 6).map((p) => (
            <div
              key={p.identity}
              title={p.name}
              className={`w-8 h-8 rounded-full border-2 border-surface-raised flex items-center justify-center text-[10px] font-bold
                ${p.isSpeaking ? 'bg-accent text-white ring-2 ring-accent/40' : 'bg-surface-overlay text-slate-300'}
                ${p.isMuted ? 'opacity-50' : ''}`}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2.5 rounded-full transition-colors cursor-pointer
              ${muted
                ? 'bg-danger/20 text-danger'
                : 'bg-surface-overlay text-white hover:bg-border'
              }`}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onHangUp}
            className="p-2.5 rounded-full bg-danger text-white hover:bg-danger/90 transition-colors cursor-pointer"
            title="Leave call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
