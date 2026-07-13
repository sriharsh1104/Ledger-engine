import { type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { wagmiAdapter } from '../lib/reown'

export function Web3Provider({ children }: { children: ReactNode }) {
  return <WagmiProvider config={wagmiAdapter.wagmiConfig}>{children}</WagmiProvider>
}
