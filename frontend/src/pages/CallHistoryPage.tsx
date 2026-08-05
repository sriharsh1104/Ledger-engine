import { useState } from 'react'
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  useCallHistory,
  useClearCallHistory,
  useContacts,
  useHideCallFromHistory,
} from '../hooks/api'
import { resolvePeerLabel } from '../lib/displayName'
import { formatDate, formatRelativeDate } from '../lib/format'
import { getApiErrorMessage } from '../api/client'
import type { CallHistoryEntry, CallHistoryEvent } from '../api/comms.types'
import type { User } from '../types'
import { Button } from '../components/ui/Button'
import { ConfirmModal } from '../components/ui/Modal'

function eventIcon(event: CallHistoryEvent, direction: CallHistoryEntry['direction']) {
  if (event === 'missed' || event === 'timeout') return PhoneMissed
  if (event === 'rejected') return PhoneOff
  if (direction === 'incoming') return PhoneIncoming
  return PhoneOutgoing
}

function eventTone(event: CallHistoryEvent) {
  if (event === 'missed' || event === 'timeout' || event === 'rejected') {
    return 'text-danger bg-danger/10'
  }
  if (event === 'completed' || event === 'ended') {
    return 'text-emerald-400 bg-emerald-400/10'
  }
  return 'text-accent bg-accent/10'
}

function peersLabel(entry: CallHistoryEntry, contacts: User[]) {
  if (!entry.peers?.length) {
    return entry.call.room?.name || 'Voice call'
  }
  return entry.peers
    .map((p) => resolvePeerLabel(p, contacts, p.name || 'User').title)
    .join(', ')
}

export function CallHistoryPage() {
  const history = useCallHistory({ limit: 50, offset: 0 })
  const contacts = useContacts({ limit: 200 })
  const clearAll = useClearCallHistory()
  const hideOne = useHideCallFromHistory()

  const [confirmClear, setConfirmClear] = useState(false)
  const [hidingId, setHidingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const entries = history.data ?? []

  async function handleHide(callId: string) {
    setError('')
    setHidingId(callId)
    try {
      await hideOne.mutateAsync(callId)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setHidingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Call history</h1>
          <p className="text-sm text-slate-400 mt-1">
            Your incoming and outgoing voice calls
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entries.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={clearAll.isPending}
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={history.isFetching}
            onClick={() => void history.refetch()}
          >
            <RefreshCw
              className={`w-4 h-4 ${history.isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {history.isLoading ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-10 text-center text-sm text-slate-400">
          Loading call history…
        </div>
      ) : history.isError ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
          {history.error instanceof Error
            ? history.error.message
            : 'Failed to load call history'}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
            <Phone className="w-5 h-5 text-accent" />
          </div>
          <p className="text-white font-medium">No calls yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Direct and group calls you make or receive will show up here.
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-border-subtle bg-surface-raised divide-y divide-border-subtle overflow-hidden">
          {entries.map((entry) => {
            const Icon = eventIcon(entry.event, entry.direction)
            const tone = eventTone(entry.event)
            const when = entry.call.endedAt || entry.call.createdAt
            const title = peersLabel(entry, contacts.data ?? [])
            const busy = hidingId === entry.call.id

            return (
              <li
                key={entry.call.id}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-overlay/60 transition-colors group"
              >
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{title}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
                      {entry.direction}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {entry.label || entry.event}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-300">{formatRelativeDate(when)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {formatDate(when)}
                  </p>
                </div>
                <button
                  type="button"
                  title="Remove from your history"
                  disabled={busy || clearAll.isPending}
                  onClick={() => void handleHide(entry.call.id)}
                  className="shrink-0 p-2 rounded-lg text-slate-500 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:text-danger hover:bg-danger/10 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className={`w-4 h-4 ${busy ? 'animate-pulse' : ''}`} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear call history?"
        message="This only hides calls for you — other users keep their history."
        confirmLabel="Clear all"
        cancelLabel="Cancel"
        onConfirm={() => {
          void (async () => {
            setError('')
            try {
              await clearAll.mutateAsync()
            } catch (err) {
              setError(getApiErrorMessage(err))
            } finally {
              setConfirmClear(false)
            }
          })()
        }}
      />
    </div>
  )
}
