import { Wallet } from 'lucide-react'
import { useWallet } from '../../context/WalletContext'
import { WalletAddress } from './WalletAddress'
import { formatCurrency } from '../../lib/format'

interface HeaderWalletButtonProps {
  onClick: () => void
}

export function HeaderWalletButton({ onClick }: HeaderWalletButtonProps) {
  const { connectedWallets } = useWallet()
  const hasWallet = connectedWallets.length > 0
  const primary = connectedWallets[0]
  const totalCrypto = connectedWallets.reduce((sum, w) => sum + w.balance, 0)

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-1.5 rounded-xl bg-surface-overlay border border-border-subtle
        hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer
        ${hasWallet ? 'min-w-[280px] sm:min-w-[320px]' : 'min-w-[140px]'}`}
    >
      <Wallet className="w-4 h-4 text-accent shrink-0" />
      {!hasWallet ? (
        <p className="text-sm font-semibold text-accent">Connect</p>
      ) : (
        <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
          <WalletAddress address={primary.address} size="md" />
          <p className="text-sm font-bold text-white font-mono whitespace-nowrap shrink-0">
            {formatCurrency(totalCrypto)} ETH
          </p>
        </div>
      )}
    </button>
  )
}
