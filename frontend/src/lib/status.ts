import type { UserStatus } from '../types'

export const USER_STATUSES: UserStatus[] = [
  'online',
  'offline',
  'busy',
  'dnd',
]

export const STATUS_META: Record<
  UserStatus,
  { label: string; description: string; dotClass: string; textClass: string }
> = {
  online: {
    label: 'Online',
    description: 'Available to chat',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
  },
  offline: {
    label: 'Offline',
    description: 'Appear offline',
    dotClass: 'bg-slate-500',
    textClass: 'text-slate-400',
  },
  busy: {
    label: 'Busy',
    description: 'In a meeting or focused',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400',
  },
  dnd: {
    label: 'Do not disturb',
    description: 'Mute notifications',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-400',
  },
}

export function normalizeUserStatus(value: unknown): UserStatus | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  if (v === 'online' || v === 'offline' || v === 'busy' || v === 'dnd') return v
  if (v === 'do_not_disturb' || v === 'do-not-disturb') return 'dnd'
  if (v === 'away') return 'busy'
  return undefined
}

export function statusLabel(status?: UserStatus | null): string {
  if (!status) return 'Unknown'
  return STATUS_META[status]?.label ?? status
}
