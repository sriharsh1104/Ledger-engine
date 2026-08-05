import type { UserStatus } from '../../types'
import { STATUS_META } from '../../lib/status'

interface StatusDotProps {
  status?: UserStatus | null
  /** Tailwind size classes for the dot */
  size?: 'sm' | 'md'
  className?: string
  /** Show ring so it sits on dark/light avatars */
  ring?: boolean
}

const sizes = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
}

/** Corner presence indicator for avatars. */
export function StatusDot({
  status,
  size = 'sm',
  className = '',
  ring = true,
}: StatusDotProps) {
  if (!status) return null
  const meta = STATUS_META[status]
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={`absolute bottom-0 right-0 rounded-full ${sizes[size]} ${meta.dotClass}
        ${ring ? 'ring-2 ring-surface-raised' : ''} ${className}`}
    />
  )
}
