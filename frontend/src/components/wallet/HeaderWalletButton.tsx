import { Wallet } from 'lucide-react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { WalletAddress } from './WalletAddress'

export function HeaderWalletButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { data: balance } = useBalance({
    address: address as `0x${string}` | undefined,
  })

  const ethBalance = balance ? parseFloat(formatEther(balance.value)) : 0

  return (
    <button
      onClick={() => open()}
      className={`flex items-center gap-3 px-5 py-1.5 rounded-xl bg-surface-overlay border border-border-subtle
        hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer
        ${isConnected ? 'min-w-[280px] sm:min-w-[320px]' : 'min-w-[140px]'}`}
    >
      <Wallet className="w-4 h-4 text-accent shrink-0" />
      {!isConnected ? (
        <p className="text-sm font-semibold text-accent">Connect</p>
      ) : (
        <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
          <WalletAddress address={address!} size="md" />
          <p className="text-sm font-bold text-white font-mono whitespace-nowrap shrink-0">
            {ethBalance.toFixed(4)} ETH
          </p>
        </div>
      )}
    </button>
  )
}
