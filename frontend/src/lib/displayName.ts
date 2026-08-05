import type { User } from '../types'

/** True when `name` looks like a truncated UUID fallback (8 hex chars). */
export function looksLikeTruncatedId(name: string | undefined, id?: string): boolean {
  if (!name) return true
  if (id && (name === id || name === id.slice(0, 8))) return true
  return /^[0-9a-f]{8}$/i.test(name)
}

/** Prefer a real username over truncated-id placeholders. */
export function bestDisplayName(
  ...candidates: Array<string | undefined | null>
): string | undefined {
  for (const c of candidates) {
    if (c && !looksLikeTruncatedId(c)) return c
  }
  for (const c of candidates) {
    if (c) return c
  }
  return undefined
}

/** Chat display: contact-list name if saved, otherwise username only. */
export function resolvePeerLabel(
  peer: Pick<User, 'id' | 'name'> &
    Partial<Pick<User, 'email' | 'isContact'>> | null | undefined,
  contacts: User[],
  fallback = 'User',
): { title: string; subtitle?: string; isContact: boolean } {
  if (!peer?.id && !peer?.name) {
    return { title: fallback, isContact: false }
  }

  const contact = peer?.id
    ? contacts.find((c) => c.id === peer.id)
    : undefined

  const isContact = Boolean(contact) || peer?.isContact === true

  if (isContact) {
    const title =
      bestDisplayName(contact?.name, peer?.name) || fallback
    const subtitle = contact?.email || peer?.email
    return { title, subtitle, isContact: true }
  }

  // Not in contacts → username only (no email)
  return {
    title: bestDisplayName(peer?.name) || fallback,
    isContact: false,
  }
}

/**
 * Resolve the DM peer from message history.
 * Prefers entries that include a real `sender.name` (not truncated uid).
 */
export function peerFromMessages(
  messages: { senderId: string; sender?: User }[],
  myId: string | undefined,
): User | null {
  if (!myId) return null

  let fallback: User | null = null

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (!m.senderId || m.senderId === myId) continue

    if (m.sender?.name && !looksLikeTruncatedId(m.sender.name, m.senderId)) {
      return m.sender
    }

    if (!fallback) {
      fallback =
        m.sender ??
        ({
          id: m.senderId,
          name: '',
          email: '',
        } as User)
    }
  }

  return fallback
}

/** Build a display peer for a senderId, using contacts + any known sender payload. */
export function resolveSenderUser(
  senderId: string,
  sender: User | undefined,
  contacts: User[],
  knownName?: string,
): User {
  const contact = contacts.find((c) => c.id === senderId)
  const name =
    bestDisplayName(contact?.name, knownName, sender?.name) ||
    'User'

  return {
    id: senderId,
    name,
    email: contact?.email || sender?.email || '',
    profileImage: contact?.profileImage || sender?.profileImage,
    isContact: Boolean(contact) || sender?.isContact === true,
    phoneCode: contact?.phoneCode || sender?.phoneCode,
    phoneNumber: contact?.phoneNumber || sender?.phoneNumber,
  }
}

/** Collect best-known usernames per senderId from a message list. */
export function senderNameIndex(
  messages: { senderId: string; sender?: User }[],
): Map<string, string> {
  const map = new Map<string, string>()
  for (const m of messages) {
    const name = m.sender?.name
    if (!name || looksLikeTruncatedId(name, m.senderId)) continue
    const prev = map.get(m.senderId)
    if (!prev || looksLikeTruncatedId(prev, m.senderId)) {
      map.set(m.senderId, name)
    }
  }
  return map
}
