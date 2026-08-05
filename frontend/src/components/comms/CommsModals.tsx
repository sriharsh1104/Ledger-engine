import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { UserSearchPicker } from './UserSearchPicker'
import type { User } from '../../types'

interface NewChannelModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; visibility: 'public' | 'private' }) => Promise<void>
}

export function NewChannelModal({ open, onClose, onSubmit }: NewChannelModalProps) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSubmit({ name: name.trim(), visibility })
      setName('')
      setVisibility('public')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create channel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Channel name"
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
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface NewDmModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (peerUserId: string) => Promise<void>
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
      await onSubmit(selected.id)
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

interface JoinByIdModalProps {
  open: boolean
  onClose: () => void
  title: string
  idLabel: string
  codeLabel?: string
  onSubmit: (id: string, inviteCode: string) => Promise<void>
}

export function JoinByIdModal({
  open,
  onClose,
  title,
  idLabel,
  codeLabel = 'Invite code (optional)',
  onSubmit,
}: JoinByIdModalProps) {
  const [id, setId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSubmit(id.trim(), code.trim())
      setId('')
      setCode('')
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
        <Input
          label={idLabel}
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoFocus
        />
        <Input
          label={codeLabel}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!id.trim()}>
            Join
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface NewRoomModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    visibility: 'public' | 'private'
  }) => Promise<void>
}

export function NewRoomModal({ open, onClose, onSubmit }: NewRoomModalProps) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSubmit({ name: name.trim(), visibility })
      setName('')
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
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
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
  onCall,
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
        {onCall && (
          <p className="text-xs text-slate-500">
            Tip: pick someone above to open a DM. Use the Call button in a chat to ring them.
          </p>
        )}
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
