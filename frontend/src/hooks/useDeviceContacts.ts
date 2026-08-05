import { useCallback, useEffect, useMemo, useState } from 'react'
import { contactsService } from '../services/contacts.service'
import { unwrapApiData } from '../lib/apiUtils'
import type { User } from '../types'
import {
  clearStoredDeviceContacts,
  createManualDeviceContact,
  type DeviceContact,
  type DeviceContactMatch,
  inviteDeviceContact,
  isDeviceContactsSupported,
  loadStoredDeviceContacts,
  mergeDeviceContacts,
  phoneMatchKey,
  pickDeviceContacts,
  saveStoredDeviceContacts,
} from '../lib/deviceContacts'

function extractUsers(data: unknown): User[] {
  if (!data) return []
  if (Array.isArray(data)) return data as User[]
  if (typeof data === 'object') {
    const obj = data as { users?: User[]; contacts?: User[] }
    if (Array.isArray(obj.users)) return obj.users
    if (Array.isArray(obj.contacts)) return obj.contacts
  }
  return []
}

function userPhoneKeys(u: User): string[] {
  const raw = `${u.phoneCode ?? ''}${u.phoneNumber ?? ''}`
  const key = phoneMatchKey(raw)
  return key.length >= 7 ? [key] : []
}

async function lookupPlatformUser(contact: DeviceContact): Promise<User | null> {
  const queries = [
    ...contact.phoneKeys.map((k) => (k.length > 10 ? k.slice(-10) : k)),
    ...contact.emails,
  ].filter(Boolean)

  for (const q of queries) {
    if (q.length < 2) continue
    try {
      const res = await contactsService.searchUsers(q, 5)
      const users = extractUsers(unwrapApiData(res))
      const emailHit = contact.emails.length
        ? users.find((u) =>
            contact.emails.includes((u.email || '').toLowerCase()),
          )
        : undefined
      if (emailHit) return emailHit

      const phoneHit = users.find((u) => {
        const keys = userPhoneKeys(u)
        return keys.some((k) => contact.phoneKeys.includes(k))
      })
      if (phoneHit) return phoneHit

      // Username exact-ish fallback when query was a phone and only one result
      if (users.length === 1 && contact.phoneKeys.length) return users[0]
    } catch {
      // try next query
    }
  }
  return null
}

export function useDeviceContacts(ownerUserId?: string) {
  const [contacts, setContacts] = useState<DeviceContact[]>(() =>
    loadStoredDeviceContacts(ownerUserId),
  )
  const [matches, setMatches] = useState<Record<string, DeviceContactMatch>>({})
  const [importing, setImporting] = useState(false)
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState('')

  const supported = useMemo(() => isDeviceContactsSupported(), [])

  useEffect(() => {
    setContacts(loadStoredDeviceContacts(ownerUserId))
  }, [ownerUserId])

  useEffect(() => {
    saveStoredDeviceContacts(contacts, ownerUserId)
  }, [contacts, ownerUserId])

  const rematch = useCallback(async (list: DeviceContact[]) => {
    if (!list.length) {
      setMatches({})
      return
    }
    setMatching(true)
    const next: Record<string, DeviceContactMatch> = {}
    for (const c of list) {
      next[c.id] = { status: 'checking' }
    }
    setMatches({ ...next })

    // Sequential to avoid hammering search API
    for (const c of list) {
      const user = await lookupPlatformUser(c)
      next[c.id] = user
        ? { status: 'on_platform', platformUser: user }
        : { status: 'not_on_platform' }
      setMatches({ ...next })
    }
    setMatching(false)
  }, [])

  useEffect(() => {
    if (!contacts.length) return
    void rematch(contacts)
    // Only rematch when contact set identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts.map((c) => c.id).join('|')])

  const importFromPhone = useCallback(async () => {
    setError('')
    setImporting(true)
    try {
      const picked = await pickDeviceContacts()
      if (!picked.length) return
      setContacts((prev) => mergeDeviceContacts(prev, picked))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read contacts')
    } finally {
      setImporting(false)
    }
  }, [])

  /**
   * Manually add a contact by phone and/or email.
   * Returns the created contact + platform match if found.
   */
  const addManual = useCallback(
    async (input: { name?: string; phone?: string; email?: string }) => {
      setError('')
      const contact = createManualDeviceContact(input)
      setContacts((prev) => mergeDeviceContacts(prev, [contact]))
      const user = await lookupPlatformUser(contact)
      setMatches((prev) => ({
        ...prev,
        [contact.id]: user
          ? { status: 'on_platform', platformUser: user }
          : { status: 'not_on_platform' },
      }))
      return { contact, platformUser: user }
    },
    [],
  )

  const removeDeviceContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    setMatches((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setContacts([])
    setMatches({})
    clearStoredDeviceContacts()
  }, [])

  const invite = useCallback(async (contact: DeviceContact) => {
    await inviteDeviceContact(contact)
  }, [])

  const filtered = useCallback(
    (q: string) => {
      const needle = q.trim().toLowerCase()
      if (!needle) return contacts
      return contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.phones.some((p) => p.includes(needle)) ||
          c.emails.some((e) => e.includes(needle)),
      )
    },
    [contacts],
  )

  return {
    supported,
    contacts,
    matches,
    importing,
    matching,
    error,
    importFromPhone,
    addManual,
    removeDeviceContact,
    clearAll,
    invite,
    filtered,
    rematch: () => rematch(contacts),
  }
}
