import { USER_STATUSES, STATUS_META } from '../../lib/status'
import { useMyStatus, useUpdateMyStatus } from '../../hooks/api/useStatus'
import type { UserStatus } from '../../types'
import { getApiErrorMessage } from '../../api/client'

interface StatusPickerProps {
  /** Compact = horizontal chips; default = stacked list */
  variant?: 'list' | 'chips'
  className?: string
}

export function StatusPicker({ variant = 'list', className = '' }: StatusPickerProps) {
  const { status } = useMyStatus()
  const update = useUpdateMyStatus()

  async function select(next: UserStatus) {
    if (next === status || update.isPending) return
    try {
      await update.mutateAsync(next)
    } catch {
      // error surfaced below
    }
  }

  if (variant === 'chips') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex flex-wrap gap-1.5">
          {USER_STATUSES.map((s) => {
            const meta = STATUS_META[s]
            const active = status === s
            return (
              <button
                key={s}
                type="button"
                disabled={update.isPending}
                onClick={() => void select(s)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                  border transition-colors cursor-pointer disabled:opacity-50
                  ${active
                    ? 'bg-accent/15 text-accent border-accent/30'
                    : 'bg-surface-overlay text-slate-300 border-border-subtle hover:border-border hover:text-white'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                {meta.label}
              </button>
            )
          })}
        </div>
        {update.isError && (
          <p className="text-xs text-danger">{getApiErrorMessage(update.error)}</p>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-[11px] uppercase tracking-wider text-slate-500 px-1 mb-1">
        Status
      </p>
      {USER_STATUSES.map((s) => {
        const meta = STATUS_META[s]
        const active = status === s
        return (
          <button
            key={s}
            type="button"
            disabled={update.isPending}
            onClick={() => void select(s)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors
              cursor-pointer disabled:opacity-50
              ${active
                ? 'bg-accent/10 border border-accent/25'
                : 'hover:bg-surface-overlay border border-transparent'
              }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dotClass}`} />
            <span className="flex-1 min-w-0">
              <span className={`block text-sm font-medium ${active ? 'text-white' : 'text-slate-200'}`}>
                {meta.label}
              </span>
              <span className="block text-[11px] text-slate-500">{meta.description}</span>
            </span>
            {active && (
              <span className="text-[10px] text-accent font-medium shrink-0">Active</span>
            )}
          </button>
        )
      })}
      {update.isError && (
        <p className="text-xs text-danger px-1 pt-1">{getApiErrorMessage(update.error)}</p>
      )}
    </div>
  )
}
