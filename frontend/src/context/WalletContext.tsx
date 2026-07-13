import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  getConnectedWallets,
  connectWallet as connectWalletApi,
  disconnectWallet as disconnectWalletApi,
  CRYPTO_PROVIDERS,
} from '../lib/cryptoWallets'
import type { ConnectedCryptoWallet, CryptoWalletProvider } from '../types'

interface WalletContextValue {
  connectedWallets: ConnectedCryptoWallet[]
  providers: CryptoWalletProvider[]
  connecting: string | null
  connect: (provider: CryptoWalletProvider) => Promise<void>
  disconnect: (walletId: string) => void
  refresh: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [connectedWallets, setConnectedWallets] = useState<ConnectedCryptoWallet[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)

  const refresh = useCallback(() => {
    if (user) setConnectedWallets(getConnectedWallets(user.id))
    else setConnectedWallets([])
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const connect = useCallback(
    async (provider: CryptoWalletProvider) => {
      if (!user) return
      setConnecting(provider.id)
      try {
        await connectWalletApi(user.id, provider)
        refresh()
      } finally {
        setConnecting(null)
      }
    },
    [user, refresh],
  )

  const disconnect = useCallback(
    (walletId: string) => {
      if (!user) return
      disconnectWalletApi(user.id, walletId)
      refresh()
    },
    [user, refresh],
  )

  return (
    <WalletContext.Provider
      value={{
        connectedWallets,
        providers: CRYPTO_PROVIDERS,
        connecting,
        connect,
        disconnect,
        refresh,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
