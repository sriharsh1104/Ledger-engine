import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useCreateDirectChannel } from '../hooks/api'
import { getApiErrorMessage } from '../api/client'
import type { User } from '../types'
import { UserSearchPicker } from '../components/comms/UserSearchPicker'

export function ContactsPage() {
  const navigate = useNavigate()
  const createDm = useCreateDirectChannel()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function openChat(peer: User) {
    setBusyId(peer.id)
    setError('')
    try {
      const channel = await createDm.mutateAsync({ peerUserId: peer.id })
      navigate('/messages', {
        state: { selectChannelId: channel.id, dmPeer: peer },
      })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
            <Users className="w-[18px] h-[18px] text-accent" />
          </span>
          Contacts
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Search, add by phone or email, import from phone, or invite people not on Ledger.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 sm:p-5">
        <UserSearchPicker
          allowManageContacts
          showPhoneBook
          actionLabel="Message"
          defaultTab="contacts"
          onSelect={(user) => void openChat(user)}
        />
        {busyId && (
          <p className="mt-3 text-xs text-slate-500">Opening chat…</p>
        )}
      </div>
    </div>
  )
}
