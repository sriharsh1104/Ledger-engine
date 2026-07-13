import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { truncateAddress, copyToClipboard } from '../../lib/format'

interface WalletAddressProps {
  address: string
  className?: string
  size?: 'sm' | 'md'
}

export function WalletAddress({ address, className = '', size = 'sm' }: WalletAddressProps) {
  const [copied, setCopied] = useState(false)
  const textClass = size === 'md' ? 'text-sm' : 'text-xs'
  const iconClass = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await copyToClipboard(address)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${textClass} text-slate-400 font-mono`}>{truncateAddress(address)}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 rounded-md text-slate-500 hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
        title="Copy address"
      >
        {copied ? <Check className={`${iconClass} text-accent`} /> : <Copy className={iconClass} />}
      </button>
    </div>
  )
}
