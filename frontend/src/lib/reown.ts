import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, arbitrum, base } from '@reown/appkit/networks'

export const networks = [mainnet, polygon, arbitrum, base] as [
  typeof mainnet,
  typeof polygon,
  typeof arbitrum,
  typeof base,
]

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID

if (!projectId) {
  console.warn(
    '[Ledger Engine] Set VITE_REOWN_PROJECT_ID in .env — get a free ID at https://cloud.reown.com',
  )
}

const metadata = {
  name: 'Ledger Engine',
  description: 'Double-entry financial ledger & banking dashboard',
  url: globalThis.location?.origin ?? 'http://localhost:5173',
  icons: [`${globalThis.location?.origin ?? 'http://localhost:5173'}/favicon.svg`],
}

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: projectId || '00000000000000000000000000000000',
  ssr: false,
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId: projectId || '00000000000000000000000000000000',
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981',
    '--w3m-border-radius-master': '12px',
  },
  features: {
    analytics: false,
  },
})
