import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Search, UserPlus, Check, X } from 'lucide-react'
import type { User } from '../../types'
import {
  useAddContact,
  useContacts,
  useRemoveContact,
  useSearchContacts,
  useSearchUsers,
} from '../../hooks/api'
import { getApiErrorMessage } from '../../api/client'

type SearchTab = 'contacts' | 'people'

interface UserSearchPickerProps {
  onSelect: (user: User) => void
  selectedId?: string | null
  /** Show add/remove contact actions in People tab */
  allowManageContacts?: boolean
  actionLabel?: string
}

function UserAvatar({ user }: { user: User }) {
  return (
    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold shrink-0 overflow-hidden">
      {user.profileImage ? (
        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
      ) : (
        (user.name || '?').charAt(0).toUpperCase()
      )}
    </div>
  )
}

export function UserSearchPicker({
  onSelect,
  selectedId,
  allowManageContacts = true,
  actionLabel = 'Select',
}: UserSearchPickerProps) {
  const [tab, setTab] = useState<SearchTab>('contacts')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const contactsQuery = useContacts({ limit: 50 })
  const contactSearch = useSearchContacts(debounced, tab === 'contacts' && debounced.length >= 1)
  const userSearch = useSearchUsers(debounced, tab === 'people')
  const addContact = useAddContact()
  const removeContact = useRemoveContact()

  const contactIds = useMemo(
    () => new Set((contactsQuery.data ?? []).map((u) => u.id)),
    [contactsQuery.data],
  )

  const results: User[] = useMemo(() => {
    if (tab === 'contacts') {
      if (debounced.length >= 1) return contactSearch.data ?? []
      return contactsQuery.data ?? []
    }
    return userSearch.data ?? []
  }, [
    tab,
    debounced,
    contactSearch.data,
    contactsQuery.data,
    userSearch.data,
  ])

  const loading =
    tab === 'contacts'
      ? debounced
        ? contactSearch.isFetching
        : contactsQuery.isLoading
      : debounced.length >= 2 && userSearch.isFetching

  async function toggleContact(user: User, e: MouseEvent) {
    e.stopPropagation()
    setError('')
    try {
      if (contactIds.has(user.id)) {
        await removeContact.mutateAsync(user.id)
      } else {
        await addContact.mutateAsync(user.id)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-xl bg-surface-overlay border border-border-subtle">
        {(
          [
            { id: 'contacts', label: 'Contacts' },
            { id: 'people', label: 'Find people' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id)
              setError('')
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
              ${tab === item.id
                ? 'bg-accent/15 text-accent'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            tab === 'contacts'
              ? 'Search contacts by username…'
              : 'Search by username, email, or phone…'
          }
          autoFocus
          className="w-full rounded-xl bg-surface-overlay border border-border pl-9 pr-4 py-2.5 text-sm text-white
            placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      {tab === 'people' && q.trim().length > 0 && q.trim().length < 2 && (
        <p className="text-xs text-slate-500">Type at least 2 characters to search users.</p>
      )}

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border-subtle divide-y divide-border-subtle">
        {loading && (
          <p className="px-3 py-4 text-sm text-slate-500 text-center">Searching…</p>
        )}
        {!loading && results.length === 0 && (
          <p className="px-3 py-4 text-sm text-slate-500 text-center">
            {tab === 'contacts' && !debounced
              ? 'No contacts yet — find people and add them'
              : 'No matches'}
          </p>
        )}
        {!loading &&
          results.map((user) => {
            const isContact = contactIds.has(user.id)
            const selected = selectedId === user.id
            return (
              <div
                key={user.id}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors
                  ${selected ? 'bg-accent/10' : 'hover:bg-surface-overlay'}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(user)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <UserAvatar user={user} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {allowManageContacts && tab === 'people' && (
                    <button
                      type="button"
                      title={isContact ? 'Remove contact' : 'Add contact'}
                      onClick={(e) => void toggleContact(user, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface cursor-pointer"
                    >
                      {isContact ? (
                        <X className="w-4 h-4 text-danger" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(user)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors
                      ${selected
                        ? 'bg-accent text-white'
                        : 'bg-surface text-slate-300 hover:text-white border border-border'
                      }`}
                  >
                    {selected ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> {actionLabel}
                      </span>
                    ) : (
                      actionLabel
                    )}
                  </button>
                </div>
              </div>
            )
          })}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
