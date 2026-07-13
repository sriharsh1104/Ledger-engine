import { type ReactNode, type CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  style?: CSSProperties
}

export function Card({ children, className = '', glow, style }: CardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 ${glow ? 'animate-[pulse-glow_3s_ease-in-out_infinite]' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400 mt-1">{children}</p>
}
