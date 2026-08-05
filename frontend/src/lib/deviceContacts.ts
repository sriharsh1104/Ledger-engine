import type { User } from '../types'

const STORAGE_KEY = 'ledger.deviceContacts.v1'

export interface DeviceContact {
  /** Stable client id */
  id: string
  name: string
  phones: string[]
  emails: string[]
  /** Digits-only phones for matching */
  phoneKeys: string[]
}

export type DeviceContactMatch =
  | { status: 'on_platform'; platformUser: User }
  | { status: 'not_on_platform' }
  | { status: 'checking' }
  | { status: 'unknown' }

/** Contact Picker API (Chrome Android / some Chromium). */
function contactsManager(): ContactsManager | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as Navigator & { contacts?: ContactsManager }
  return nav.contacts ?? null
}

export function isDeviceContactsSupported(): boolean {
  return Boolean(contactsManager()?.select)
}

export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Prefer last 10 digits for loose international match. */
export function phoneMatchKey(raw: string): string {
  const digits = normalizePhoneDigits(raw)
  if (digits.length <= 10) return digits
  return digits.slice(-10)
}

function contactId(name: string, phones: string[], emails: string[]): string {
  const seed = `${name}|${phones.join(',')}|${emails.join(',')}`.toLowerCase()
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return `dc_${Math.abs(hash).toString(36)}`
}

export function loadStoredDeviceContacts(ownerUserId?: string): DeviceContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as {
      ownerId?: string
      contacts?: DeviceContact[]
    }
    if (ownerUserId && parsed.ownerId && parsed.ownerId !== ownerUserId) {
      return []
    }
    return Array.isArray(parsed.contacts) ? parsed.contacts : []
  } catch {
    return []
  }
}

export function saveStoredDeviceContacts(
  contacts: DeviceContact[],
  ownerUserId?: string,
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ownerId: ownerUserId ?? null, contacts }),
    )
  } catch {
    // private mode / quota — ignore
  }
}

export function clearStoredDeviceContacts() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function mapPickerContacts(
  picked: Array<{ name?: string[]; email?: string[]; tel?: string[] }>,
): DeviceContact[] {
  const out: DeviceContact[] = []
  for (const c of picked) {
    const name = (c.name?.[0] || c.email?.[0] || c.tel?.[0] || 'Unknown').trim()
    const phones = (c.tel ?? []).map((t) => t.trim()).filter(Boolean)
    const emails = (c.email ?? [])
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    if (!phones.length && !emails.length) continue
    const phoneKeys = [...new Set(phones.map(phoneMatchKey).filter((k) => k.length >= 7))]
    out.push({
      id: contactId(name, phones, emails),
      name,
      phones,
      emails,
      phoneKeys,
    })
  }
  return out
}

/** Merge by id; newer/picked wins. */
export function mergeDeviceContacts(
  existing: DeviceContact[],
  incoming: DeviceContact[],
): DeviceContact[] {
  const map = new Map<string, DeviceContact>()
  for (const c of existing) map.set(c.id, c)
  for (const c of incoming) map.set(c.id, c)
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Build a DeviceContact from manually entered name / phone / email.
 * Requires at least one of phone or email.
 */
export function createManualDeviceContact(input: {
  name?: string
  phone?: string
  email?: string
}): DeviceContact {
  const phone = (input.phone ?? '').trim()
  const email = (input.email ?? '').trim().toLowerCase()
  const name =
    (input.name ?? '').trim() ||
    email ||
    phone ||
    'Unknown'

  if (!phone && !email) {
    throw new Error('Enter a phone number or email')
  }
  if (email && !looksLikeEmail(email)) {
    throw new Error('Enter a valid email address')
  }
  if (phone) {
    const digits = normalizePhoneDigits(phone)
    if (digits.length < 7) {
      throw new Error('Enter a valid phone number')
    }
  }

  const phones = phone ? [phone] : []
  const emails = email ? [email] : []
  const phoneKeys = [
    ...new Set(phones.map(phoneMatchKey).filter((k) => k.length >= 7)),
  ]

  return {
    id: contactId(name, phones, emails),
    name,
    phones,
    emails,
    phoneKeys,
  }
}

/**
 * Open the system contact picker (mobile Chrome).
 * Returns newly selected contacts (may be empty if cancelled).
 */
export async function pickDeviceContacts(): Promise<DeviceContact[]> {
  const mgr = contactsManager()
  if (!mgr?.select) {
    throw new Error(
      'Phone contacts are not supported in this browser. Use Chrome on Android, or invite by SMS/share.',
    )
  }
  const picked = await mgr.select(['name', 'email', 'tel'], { multiple: true })
  return mapPickerContacts(picked ?? [])
}

export function appInviteUrl(): string {
  if (typeof window === 'undefined') return 'https://app.example.com/signup'
  return `${window.location.origin}/signup`
}

export function inviteMessage(contactName?: string): string {
  const url = appInviteUrl()
  const who = contactName ? `${contactName}, ` : ''
  return `${who}join me on Ledger Engine — chat & calls: ${url}`
}

/** Open SMS compose, Share sheet, or mailto for inviting off-platform contacts. */
export async function inviteDeviceContact(contact: DeviceContact): Promise<void> {
  const text = inviteMessage(contact.name)
  const url = appInviteUrl()
  const phone = contact.phones[0]
  const email = contact.emails[0]

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Join Ledger Engine',
        text,
        url,
      })
      return
    } catch (err) {
      // User cancel → stop; other errors fall through
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
  }

  if (phone) {
    const digits = normalizePhoneDigits(phone)
    window.open(
      `sms:${digits}?body=${encodeURIComponent(text)}`,
      '_blank',
    )
    return
  }

  if (email) {
    window.open(
      `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Join Ledger Engine')}&body=${encodeURIComponent(text)}`,
      '_blank',
    )
    return
  }

  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

interface ContactsManager {
  select(
    properties: string[],
    options?: { multiple?: boolean },
  ): Promise<Array<{ name?: string[]; email?: string[]; tel?: string[] }>>
}
