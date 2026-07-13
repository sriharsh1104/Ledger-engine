import type { CryptoWalletProvider, ConnectedCryptoWallet } from '../types'

export const CRYPTO_PROVIDERS: CryptoWalletProvider[] = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', color: '#f6851b' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', color: '#0052ff' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', color: '#3b99fc' },
  { id: 'phantom', name: 'Phantom', icon: '👻', color: '#ab9ff2' },
  { id: 'trust', name: 'Trust Wallet', icon: '🛡️', color: '#3375bb' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', color: '#001e59' },
  { id: 'ledger', name: 'Ledger', icon: '🔐', color: '#000000' },
  { id: 'brave', name: 'Brave Wallet', icon: '🦁', color: '#fb542b' },
]

const WALLETS_KEY = 'ledger_crypto_wallets'

function randomAddress() {
  const hex = Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('')
  return `0x${hex}`
}

function randomBalance() {
  return Math.round((Math.random() * 5 + 0.01) * 10000) / 10000
}

export function getConnectedWallets(userId: string): ConnectedCryptoWallet[] {
  const raw = localStorage.getItem(WALLETS_KEY)
  if (!raw) return []
  const all = JSON.parse(raw) as Record<string, ConnectedCryptoWallet[]>
  return (all[userId] ?? []).map((w) => ({
    ...w,
    balance: w.balance ?? randomBalance(),
  }))
}

export function saveConnectedWallets(userId: string, wallets: ConnectedCryptoWallet[]) {
  const raw = localStorage.getItem(WALLETS_KEY)
  const all: Record<string, ConnectedCryptoWallet[]> = raw ? JSON.parse(raw) : {}
  all[userId] = wallets
  localStorage.setItem(WALLETS_KEY, JSON.stringify(all))
}

export async function connectWallet(
  userId: string,
  provider: CryptoWalletProvider,
): Promise<ConnectedCryptoWallet> {
  await new Promise((r) => setTimeout(r, 800))
  const existing = getConnectedWallets(userId)
  if (existing.some((w) => w.providerId === provider.id)) {
    throw new Error(`${provider.name} is already connected`)
  }
  const wallet: ConnectedCryptoWallet = {
    id: crypto.randomUUID(),
    providerId: provider.id,
    providerName: provider.name,
    address: randomAddress(),
    balance: randomBalance(),
    connectedAt: new Date().toISOString(),
  }
  saveConnectedWallets(userId, [...existing, wallet])
  return wallet
}

export function disconnectWallet(userId: string, walletId: string) {
  const existing = getConnectedWallets(userId)
  saveConnectedWallets(
    userId,
    existing.filter((w) => w.id !== walletId),
  )
}
