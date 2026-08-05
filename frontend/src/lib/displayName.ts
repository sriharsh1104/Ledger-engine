import type { User } from '../types'

/** Chat display: contact-list name if saved, otherwise username only. */
export function resolvePeerLabel(
  peer: Pick<User, 'id' | 'name' | 'email' | 'isContact'> | null | undefined,
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
    // Prefer contact-list entry name when available
    const title = contact?.name || peer?.name || fallback
    const subtitle = contact?.email || peer?.email
    return { title, subtitle, isContact: true }
  }

  // Not in contacts → username only (no email)
  return {
    title: peer?.name || fallback,
    isContact: false,
  }
}

export function peerFromMessages(
  messages: { senderId: string; sender?: User }[],
  myId: string | undefined,
): User | null {
  if (!myId) return null
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.senderId && m.senderId !== myId) {
      return (
        m.sender ??
        ({
          id: m.senderId,
          name: m.senderId.slice(0, 8),
          email: '',
        } as User)
      )
    }
  }
  return null
}
