import { useState, useEffect, type FormEvent } from 'react'
import { Hash, Lock, Search } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { UserSearchPicker } from './UserSearchPicker'
import { useSearchChannels } from '../../hooks/api'
import type { Channel } from '../../api/comms.types'
import type { User } from '../../types'

interface NewChannelModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    visibility: 'public' | 'private'
    password?: string
  }) => Promise<void>
}

export function NewChannelModal({ open, onClose, onSubmit }: NewChannelModalProps) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setVisibility('public')
      setPassword('')
      setError('')
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (visibility === 'private' && password.trim().length < 4) {
      setError('Private groups need a password (min 4 characters)')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        name: name.trim(),
        visibility,
        ...(visibility === 'private' ? { password: password.trim() } : {}),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="general"
          autoFocus
        />
        <div>
          <p className="text-xs text-slate-400 mb-2">Visibility</p>
          <div className="flex gap-2">
            {(['public', 'private'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`flex-1 py-2 rounded-xl text-sm capitalize border cursor-pointer transition-colors
                  ${visibility === v
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border text-slate-400 hover:bg-surface-overlay'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {visibility === 'public'
              ? 'Public groups get an invite code. Others find by name and join themselves — nobody is auto-added.'
              : 'Private groups get a random invite code. Members need the code (and password) to join.'}
          </p>
        </div>
        {visibility === 'private' && (
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 4 characters"
          />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!name.trim() || (visibility === 'private' && password.trim().length < 4)}
          >
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface FindGroupModalProps {
  open: boolean
  onClose: () => void
  onJoin: (channel: Channel) => Promise<void>
}

export function FindGroupModal({ open, onClose, onJoin }: FindGroupModalProps) {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const search = useSearchChannels(debounced, open)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!open) {
      setQ('')
      setDebounced('')
      setError('')
      setJoiningId(null)
    }
  }, [open])

  async function handleJoin(channel: Channel) {
    setJoiningId(channel.id)
    setError('')
    try {
      await onJoin(channel)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Join failed')
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Find public groups" size="md">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by group name…"
            autoFocus
            className="w-full rounded-xl bg-surface-overlay border border-border pl-9 pr-4 py-2.5 text-sm text-white
              placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Only public groups appear here. Joining is optional — you choose which groups to enter.
        </p>
        <div className="max-h-72 overflow-y-auto rounded-xl border border-border-subtle divide-y divide-border-subtle">
          {search.isFetching && (
            <p className="px-3 py-4 text-sm text-slate-500 text-center">Searching…</p>
          )}
          {!search.isFetching && debounced && (search.data?.length ?? 0) === 0 && (
            <p className="px-3 py-4 text-sm text-slate-500 text-center">No public groups found</p>
          )}
          {!debounced && (
            <p className="px-3 py-4 text-sm text-slate-500 text-center">Type a name to search</p>
          )}
          {(search.data ?? []).map((channel) => (
            <div
              key={channel.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-overlay"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                {channel.visibility === 'private' ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Hash className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{channel.name}</p>
                <p className="text-[11px] text-slate-500">
                  {channel.visibility} · {channel.memberCount} members
                </p>
              </div>
              <Button
                size="sm"
                loading={joiningId === channel.id}
                onClick={() => void handleJoin(channel)}
              >
                Join
              </Button>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface NewDmModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (peer: User) => Promise<void>
}

export function NewDmModal({ open, onClose, onSubmit }: NewDmModalProps) {
  const [selected, setSelected] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setSelected(null)
      setError('')
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      await onSubmit(selected)
      setSelected(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open DM')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New direct message" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <UserSearchPicker
          selectedId={selected?.id}
          onSelect={setSelected}
          actionLabel="Pick"
        />
        {selected && (
          <p className="text-xs text-slate-400">
            Messaging <span className="text-white font-medium">{selected.name}</span>
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!selected}>
            Open chat
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface JoinByCodeModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** When true, password field is required */
  requirePassword?: boolean
  idLabel?: string
  showIdField?: boolean
  codeLabel?: string
  onSubmit: (data: {
    id: string
    inviteCode: string
    password: string
  }) => Promise<void>
}

export function JoinByCodeModal({
  open,
  onClose,
  title,
  requirePassword = false,
  idLabel = 'ID',
  showIdField = true,
  codeLabel = 'Invite code',
  onSubmit,
}: JoinByCodeModalProps) {
  const [id, setId] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setId('')
      setCode('')
      setPassword('')
      setError('')
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (showIdField && !id.trim()) return
    if (!code.trim()) {
      setError('Invite code is required')
      return
    }
    if (requirePassword && password.trim().length < 4) {
      setError('Password is required (min 4 characters)')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        id: id.trim(),
        inviteCode: code.trim(),
        password: password.trim(),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Join failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {showIdField && (
          <Input
            label={idLabel}
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoFocus
          />
        )}
        <Input
          label={codeLabel}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus={!showIdField}
        />
        {requirePassword && (
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Room password"
          />
        )}
        {!requirePassword && (
          <Input
            label="Password (optional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Only if the group is private"
          />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={(showIdField && !id.trim()) || !code.trim()}
          >
            Join
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/** @deprecated use JoinByCodeModal */
export function JoinByIdModal({
  open,
  onClose,
  title,
  idLabel,
  codeLabel = 'Invite code (optional)',
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  title: string
  idLabel: string
  codeLabel?: string
  onSubmit: (id: string, inviteCode: string) => Promise<void>
}) {
  return (
    <JoinByCodeModal
      open={open}
      onClose={onClose}
      title={title}
      idLabel={idLabel}
      codeLabel={codeLabel}
      requirePassword={false}
      onSubmit={async ({ id, inviteCode }) => onSubmit(id, inviteCode)}
    />
  )
}

interface NewRoomModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    visibility: 'public' | 'private'
    password?: string
  }) => Promise<void>
}

export function NewRoomModal({ open, onClose, onSubmit }: NewRoomModalProps) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setVisibility('public')
      setPassword('')
      setError('')
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    if (visibility === 'private' && password.trim().length < 4) {
      setError('Private rooms need a password (min 4 characters)')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        name: name.trim(),
        visibility,
        ...(visibility === 'private' ? { password: password.trim() } : {}),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create voice room">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lobby"
          autoFocus
        />
        <div>
          <p className="text-xs text-slate-400 mb-2">Visibility</p>
          <div className="flex gap-2">
            {(['public', 'private'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`flex-1 py-2 rounded-xl text-sm capitalize border cursor-pointer transition-colors
                  ${visibility === v
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border text-slate-400 hover:bg-surface-overlay'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {visibility === 'public'
              ? 'Public rooms get an invite code and appear in the public list — no password.'
              : 'Private rooms get a random invite code. Joiners must enter code + password.'}
          </p>
        </div>
        {visibility === 'private' && (
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 4 characters"
          />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!name.trim() || (visibility === 'private' && password.trim().length < 4)}
          >
            Create & join
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface StartCallModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (peerUserId: string) => Promise<void>
}

export function StartCallModal({ open, onClose, onSubmit }: StartCallModalProps) {
  const [selected, setSelected] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setSelected(null)
      setError('')
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      await onSubmit(selected.id)
      setSelected(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Call failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Start voice call" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <UserSearchPicker
          selectedId={selected?.id}
          onSelect={setSelected}
          actionLabel="Call"
        />
        {selected && (
          <p className="text-xs text-slate-400">
            Calling <span className="text-white font-medium">{selected.name}</span>
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!selected}>
            Call
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface ContactsModalProps {
  open: boolean
  onClose: () => void
  onMessage?: (user: User) => Promise<void> | void
  onCall?: (user: User) => Promise<void> | void
}

export function ContactsModal({
  open,
  onClose,
  onMessage,
}: ContactsModalProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="Contacts & people" size="md">
      <div className="space-y-4">
        <UserSearchPicker
          allowManageContacts
          actionLabel="Select"
          onSelect={async (user) => {
            if (!onMessage) return
            setBusyId(user.id)
            setError('')
            try {
              await onMessage(user)
              onClose()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed')
            } finally {
              setBusyId(null)
            }
          }}
        />
        {busyId && <p className="text-xs text-slate-500">Opening chat…</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
