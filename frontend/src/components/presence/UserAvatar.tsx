import type { UserStatus } from '../../types'
import { StatusDot } from './StatusDot'

interface UserAvatarProps {
  name: string
  image?: string
  status?: UserStatus | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const box = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

/** Avatar with optional presence dot. */
export function UserAvatar({
  name,
  image,
  status,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  return (
    <div className={`relative shrink-0 ${box[size]} ${className}`}>
      <div
        className={`w-full h-full rounded-full bg-accent/20 flex items-center justify-center
          text-accent font-semibold overflow-hidden`}
      >
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          (name || '?').charAt(0).toUpperCase()
        )}
      </div>
      <StatusDot
        status={status}
        size={size === 'lg' || size === 'xl' ? 'md' : 'sm'}
      />
    </div>
  )
}
