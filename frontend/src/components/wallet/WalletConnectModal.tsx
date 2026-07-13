import { useState } from 'react'
import { Check, Unlink, Wallet } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useWallet } from '../../context/WalletContext'
import { WalletAddress } from './WalletAddress'
import { formatCurrency } from '../../lib/format'
import type { CryptoWalletProvider } from '../../types'

interface WalletConnectModalProps {
  open: boolean
  onClose: () => void
}

export function WalletConnectModal({ open, onClose }: WalletConnectModalProps) {
  const { providers, connectedWallets, connecting, connect, disconnect } = useWallet()
  const [error, setError] = useState('')

  async function handleConnect(provider: CryptoWalletProvider) {
    setError('')
    try {
      await connect(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  const isConnected = (providerId: string) =>
    connectedWallets.some((w) => w.providerId === providerId)

  return (
    <Modal open={open} onClose={onClose} title="Connect Crypto Wallet" size="lg">
      <p className="text-sm text-slate-400 mb-4">
        Connect multiple wallets to manage your crypto assets. Supported providers:
      </p>

      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger mb-4">
          {error}
        </div>
      )}

      {connectedWallets.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Connected ({connectedWallets.length})
          </p>
          <div className="space-y-2">
            {connectedWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-3 rounded-xl bg-accent/5 border border-accent/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{wallet.providerName}</p>
                    <WalletAddress address={wallet.address} />
                    <p className="text-sm font-semibold text-accent font-mono mt-1">
                      {formatCurrency(wallet.balance)} ETH
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => disconnect(wallet.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
                  title="Disconnect"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
        Available Wallets
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {providers.map((provider) => {
          const connected = isConnected(provider.id)
          const loading = connecting === provider.id
          return (
            <button
              key={provider.id}
              onClick={() => !connected && handleConnect(provider)}
              disabled={connected || !!connecting}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer
                ${connected
                  ? 'border-accent/30 bg-accent/5 opacity-60 cursor-not-allowed'
                  : 'border-border-subtle hover:border-accent/40 hover:bg-surface-overlay'
                }
                disabled:cursor-not-allowed`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${provider.color}20` }}
              >
                {provider.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{provider.name}</p>
                {connected ? (
                  <p className="text-xs text-accent flex items-center gap-1">
                    <Check className="w-3 h-3" /> Connected
                  </p>
                ) : loading ? (
                  <p className="text-xs text-slate-500">Connecting...</p>
                ) : (
                  <p className="text-xs text-accent font-medium">Connect</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border-subtle text-xs text-slate-500">
        <Wallet className="w-3.5 h-3.5" />
        Connect as many wallets as you need — no limit
      </div>
    </Modal>
  )
}
