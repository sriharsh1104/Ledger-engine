import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import {
  Check,
  MessageCircle,
  Plus,
  Search,
  Smartphone,
  UserPlus,
  X,
} from 'lucide-react'
import type { User } from '../../types'
import {
  resolveUserStatus,
  useAddContact,
  useContacts,
  useRemoveContact,
  useSearchContacts,
  useSearchUsers,
  useUsersStatus,
} from '../../hooks/api'
import { useDeviceContacts } from '../../hooks/useDeviceContacts'
import { useAuth } from '../../hooks/useAuth'
import { getApiErrorMessage } from '../../api/client'
import { statusLabel } from '../../lib/status'
import { Button } from '../ui/Button'
import { UserAvatar } from '../presence/UserAvatar'
import type { DeviceContact } from '../../lib/deviceContacts'

type SearchTab = 'contacts' | 'phone' | 'people'

interface UserSearchPickerProps {
  onSelect: (user: User) => void
  selectedId?: string | null
  /** Show add/remove contact actions */
  allowManageContacts?: boolean
  /** Show phone-book import + Invite for off-platform contacts */
  showPhoneBook?: boolean
  /** Primary row action label (e.g. Message, Add, Select) */
  actionLabel?: string
  /** Hide users already in this set (e.g. current group members) */
  excludeIds?: string[]
  /** Start on contacts, phone, or people tab */
  defaultTab?: SearchTab
  /** Optional secondary action (e.g. Message from contacts modal) */
  onSecondary?: (user: User) => void
  secondaryLabel?: string
}

export function UserSearchPicker({
  onSelect,
  selectedId,
  allowManageContacts = true,
  showPhoneBook = true,
  actionLabel = 'Select',
  excludeIds,
  defaultTab = 'contacts',
  onSecondary,
  secondaryLabel,
}: UserSearchPickerProps) {
  const { user: me } = useAuth()
  const [tab, setTab] = useState<SearchTab>(
    defaultTab === 'phone' && !showPhoneBook ? 'contacts' : defaultTab,
  )
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualBusy, setManualBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const contactsQuery = useContacts({ limit: 100 })
  const contactSearch = useSearchContacts(
    debounced,
    tab === 'contacts' && debounced.length >= 1,
  )
  const userSearch = useSearchUsers(debounced, tab === 'people')
  const addContact = useAddContact()
  const removeContact = useRemoveContact()
  const device = useDeviceContacts(me?.id)

  const contactIds = useMemo(
    () => new Set((contactsQuery.data ?? []).map((u) => u.id)),
    [contactsQuery.data],
  )
  const excluded = useMemo(() => new Set(excludeIds ?? []), [excludeIds])

  const results: User[] = useMemo(() => {
    let list: User[] = []
    if (tab === 'contacts') {
      list =
        debounced.length >= 1
          ? (contactSearch.data ?? [])
          : (contactsQuery.data ?? [])
    } else if (tab === 'people') {
      list = userSearch.data ?? []
    }
    if (!excluded.size) return list
    return list.filter((u) => !excluded.has(u.id))
  }, [
    tab,
    debounced,
    contactSearch.data,
    contactsQuery.data,
    userSearch.data,
    excluded,
  ])

  const statusIds = useMemo(() => {
    const ids = results.map((u) => u.id)
    for (const c of device.contacts) {
      const match = device.matches[c.id]
      if (match?.status === 'on_platform' && match.platformUser) {
        ids.push(match.platformUser.id)
      }
    }
    return ids
  }, [results, device.contacts, device.matches])

  const statusQuery = useUsersStatus(statusIds, statusIds.length > 0)
  const statusMap = statusQuery.data

  const phoneList: DeviceContact[] = useMemo(
    () => device.filtered(debounced),
    [device, debounced],
  )

  const loading =
    tab === 'phone'
      ? device.importing
      : tab === 'contacts'
        ? debounced
          ? contactSearch.isFetching
          : contactsQuery.isLoading
        : debounced.length >= 2 && userSearch.isFetching

  const tabs = (
    [
      { id: 'contacts' as const, label: 'Contacts' },
      ...(showPhoneBook
        ? [{ id: 'phone' as const, label: 'Phone' }]
        : []),
      { id: 'people' as const, label: 'Find people' },
    ]
  )

  async function toggleContact(platformUser: User, e: MouseEvent) {
    e.stopPropagation()
    setError('')
    setBusyId(platformUser.id)
    try {
      if (contactIds.has(platformUser.id)) {
        await removeContact.mutateAsync(platformUser.id)
      } else {
        await addContact.mutateAsync(platformUser.id)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function invitePhone(contact: DeviceContact, e: MouseEvent) {
    e.stopPropagation()
    setError('')
    try {
      await device.invite(contact)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    }
  }

  async function handleManualAdd(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setManualBusy(true)
    try {
      const { contact, platformUser } = await device.addManual({
        name: manualName,
        phone: manualPhone,
        email: manualEmail,
      })

      if (platformUser) {
        if (!contactIds.has(platformUser.id) && allowManageContacts) {
          await addContact.mutateAsync(platformUser.id)
        }
        setSuccess(`Added ${platformUser.name} to your contacts`)
        setTab('contacts')
      } else {
        if (showPhoneBook) setTab('phone')
        setSuccess(
          `${contact.name} saved. They’re not on Ledger yet — tap Invite to send them a link.`,
        )
      }

      setManualName('')
      setManualPhone('')
      setManualEmail('')
      setManualOpen(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : getApiErrorMessage(err),
      )
    } finally {
      setManualBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-xl bg-surface-overlay border border-border-subtle">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id)
              setError('')
              setSuccess('')
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

      {allowManageContacts && (
        <div className="rounded-xl border border-border-subtle bg-surface-overlay/50 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setManualOpen((v) => !v)
              setError('')
              setSuccess('')
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm cursor-pointer hover:bg-surface-overlay transition-colors"
          >
            <span className="inline-flex items-center gap-2 font-medium text-slate-200">
              <Plus className="w-4 h-4 text-accent" />
              Add by phone or email
            </span>
            <span className="text-[11px] text-slate-500">
              {manualOpen ? 'Hide' : 'Manual'}
            </span>
          </button>

          {manualOpen && (
            <form
              onSubmit={(e) => void handleManualAdd(e)}
              className="px-3 pb-3 space-y-2 border-t border-border-subtle pt-3"
            >
              <p className="text-[11px] text-slate-500">
                Enter a phone number and/or email. If they’re on Ledger, they’re saved to
                contacts; otherwise you can invite them.
              </p>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <input
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <input
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                autoComplete="email"
                className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm text-white
                  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full"
                loading={manualBusy}
                disabled={!manualPhone.trim() && !manualEmail.trim()}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add contact
              </Button>
            </form>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            tab === 'phone'
              ? 'Search phone book…'
              : tab === 'contacts'
                ? 'Search contacts by username…'
                : 'Search by username, email, or phone…'
          }
          autoFocus
          className="w-full rounded-xl bg-surface-overlay border border-border pl-9 pr-4 py-2.5 text-sm text-white
            placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      {tab === 'phone' && (
        <div className="space-y-2">
          <button
            type="button"
            disabled={device.importing}
            onClick={() => void device.importFromPhone()}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium
              bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 cursor-pointer disabled:opacity-50"
          >
            <Smartphone className="w-4 h-4" />
            {device.importing ? 'Opening phone book…' : 'Import from phone'}
          </button>
          {!device.supported && (
            <p className="text-xs text-slate-500">
              Contact picker works best in Chrome on Android. You can still add manually or Invite via SMS/share.
            </p>
          )}
          {device.contacts.length > 0 && (
            <button
              type="button"
              onClick={() => device.clearAll()}
              className="text-[11px] text-slate-500 hover:text-danger cursor-pointer"
            >
              Clear imported phone contacts
            </button>
          )}
        </div>
      )}

      {tab === 'people' && q.trim().length > 0 && q.trim().length < 2 && (
        <p className="text-xs text-slate-500">Type at least 2 characters to search users.</p>
      )}
      {tab === 'people' && !debounced && (
        <p className="text-xs text-slate-500">
          Search people, then tap + to add them to your contacts.
        </p>
      )}

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border-subtle divide-y divide-border-subtle">
        {tab !== 'phone' && loading && (
          <p className="px-3 py-4 text-sm text-slate-500 text-center">Searching…</p>
        )}

        {tab !== 'phone' && !loading && results.length === 0 && (
          <p className="px-3 py-4 text-sm text-slate-500 text-center">
            {tab === 'contacts' && !debounced
              ? 'No contacts yet — use Phone or Find people'
              : 'No matches'}
          </p>
        )}

        {tab === 'phone' && phoneList.length === 0 && !device.importing && (
          <p className="px-3 py-4 text-sm text-slate-500 text-center">
            Import phone contacts. On Ledger → Message/Save; others → Invite.
          </p>
        )}

        {tab !== 'phone' &&
          !loading &&
          results.map((user) => {
            const isContact = contactIds.has(user.id)
            const selected = selectedId === user.id
            const presence = resolveUserStatus(user.id, user.status, statusMap)
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
                  <UserAvatar
                    name={user.name}
                    image={user.profileImage}
                    status={presence}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {presence
                        ? statusLabel(presence)
                        : user.email || (isContact ? 'Contact' : 'User')}
                      {presence && (user.email || isContact)
                        ? ` · ${user.email || (isContact ? 'Contact' : 'User')}`
                        : ''}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {allowManageContacts && (
                    <button
                      type="button"
                      title={isContact ? 'Remove from contacts' : 'Add to contacts'}
                      disabled={busyId === user.id}
                      onClick={(e) => void toggleContact(user, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface cursor-pointer disabled:opacity-40"
                    >
                      {isContact ? (
                        <X className="w-4 h-4 text-danger" />
                      ) : (
                        <UserPlus className="w-4 h-4 text-accent" />
                      )}
                    </button>
                  )}
                  {onSecondary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onSecondary(user)}
                      title={secondaryLabel || 'Message'}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
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

        {tab === 'phone' &&
          phoneList.map((c) => {
            const match = device.matches[c.id]
            const onPlatform =
              match?.status === 'on_platform' ? match.platformUser : null
            if (onPlatform && excluded.has(onPlatform.id)) return null
            const saved = onPlatform ? contactIds.has(onPlatform.id) : false
            const busy = busyId === c.id || busyId === onPlatform?.id
            const selected = onPlatform ? selectedId === onPlatform.id : false
            const presence = onPlatform
              ? resolveUserStatus(onPlatform.id, onPlatform.status, statusMap)
              : undefined

            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors
                  ${selected ? 'bg-accent/10' : 'hover:bg-surface-overlay'}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <UserAvatar
                    name={onPlatform?.name || c.name}
                    image={onPlatform?.profileImage}
                    status={presence}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {match?.status === 'checking' || device.matching
                        ? 'Checking…'
                        : onPlatform
                          ? `${presence ? `${statusLabel(presence)} · ` : ''}@${onPlatform.name}`
                          : c.phones[0] || c.emails[0] || 'Not on Ledger'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {onPlatform ? (
                    <>
                      {allowManageContacts && !saved && (
                        <button
                          type="button"
                          title="Add to contacts"
                          disabled={busy}
                          onClick={(e) => void toggleContact(onPlatform, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface cursor-pointer disabled:opacity-40"
                        >
                          <UserPlus className="w-4 h-4 text-accent" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelect(onPlatform)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors
                          ${selected
                            ? 'bg-accent text-white'
                            : 'bg-surface text-slate-300 hover:text-white border border-border'
                          }`}
                      >
                        {actionLabel}
                      </button>
                    </>
                  ) : match?.status !== 'checking' ? (
                    <button
                      type="button"
                      title="Invite to Ledger Engine"
                      disabled={busy}
                      onClick={(e) => void invitePhone(c, e)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 cursor-pointer disabled:opacity-40"
                    >
                      Invite
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
      </div>

      {success && (
        <p className="text-sm text-accent">{success}</p>
      )}
      {(error || (tab === 'phone' && device.error)) && (
        <p className="text-sm text-danger">{error || device.error}</p>
      )}
    </div>
  )
}
