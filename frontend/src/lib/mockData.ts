import type { Wallet, Transfer, LedgerEntry, LedgerAudit } from '../types'

export const wallets: Wallet[] = [
  {
    id: 'w1',
    name: 'Primary Checking',
    currency: 'USD',
    available: 24850.75,
    pending: 320.0,
    accountNumber: '**** 4821',
  },
  {
    id: 'w2',
    name: 'Savings Reserve',
    currency: 'USD',
    available: 125400.0,
    pending: 0,
    accountNumber: '**** 7392',
  },
  {
    id: 'w3',
    name: 'Business Account',
    currency: 'USD',
    available: 87320.5,
    pending: 1500.0,
    accountNumber: '**** 1056',
  },
]

export const transfers: Transfer[] = [
  {
    id: 't1',
    fromWalletId: 'w1',
    toWalletId: 'w2',
    amount: 5000,
    memo: 'Monthly savings transfer',
    status: 'completed',
    createdAt: '2026-07-12T14:30:00Z',
  },
  {
    id: 't2',
    fromWalletId: 'w3',
    toWalletId: 'w1',
    amount: 2500,
    memo: 'Payroll deposit',
    status: 'completed',
    createdAt: '2026-07-11T09:15:00Z',
  },
  {
    id: 't3',
    fromWalletId: 'w1',
    toWalletId: 'w3',
    amount: 1200,
    memo: 'Vendor payment - Acme Corp',
    status: 'pending',
    createdAt: '2026-07-10T16:45:00Z',
  },
  {
    id: 't4',
    fromWalletId: 'w2',
    toWalletId: 'w1',
    amount: 800,
    memo: 'Emergency fund withdrawal',
    status: 'completed',
    createdAt: '2026-07-09T11:20:00Z',
  },
  {
    id: 't5',
    fromWalletId: 'w1',
    toWalletId: 'w2',
    amount: 350,
    memo: 'Utility bill payment',
    status: 'failed',
    createdAt: '2026-07-08T08:00:00Z',
  },
]

export const ledgerEntries: LedgerEntry[] = [
  {
    id: 'e1',
    transferId: 't1',
    account: 'Primary Checking',
    debit: 5000,
    credit: null,
    balance: 24850.75,
    description: 'Transfer to Savings Reserve',
    timestamp: '2026-07-12T14:30:00Z',
  },
  {
    id: 'e2',
    transferId: 't1',
    account: 'Savings Reserve',
    debit: null,
    credit: 5000,
    balance: 125400.0,
    description: 'Transfer from Primary Checking',
    timestamp: '2026-07-12T14:30:00Z',
  },
  {
    id: 'e3',
    transferId: 't2',
    account: 'Business Account',
    debit: 2500,
    credit: null,
    balance: 87320.5,
    description: 'Payroll deposit to checking',
    timestamp: '2026-07-11T09:15:00Z',
  },
  {
    id: 'e4',
    transferId: 't2',
    account: 'Primary Checking',
    debit: null,
    credit: 2500,
    balance: 29850.75,
    description: 'Payroll deposit received',
    timestamp: '2026-07-11T09:15:00Z',
  },
  {
    id: 'e5',
    transferId: 't3',
    account: 'Primary Checking',
    debit: 1200,
    credit: null,
    balance: 23650.75,
    description: 'Vendor payment - Acme Corp',
    timestamp: '2026-07-10T16:45:00Z',
  },
  {
    id: 'e6',
    transferId: 't3',
    account: 'Business Account',
    debit: null,
    credit: 1200,
    balance: 88520.5,
    description: 'Vendor payment received',
    timestamp: '2026-07-10T16:45:00Z',
  },
  {
    id: 'e7',
    transferId: 't4',
    account: 'Savings Reserve',
    debit: 800,
    credit: null,
    balance: 124600.0,
    description: 'Emergency fund withdrawal',
    timestamp: '2026-07-09T11:20:00Z',
  },
  {
    id: 'e8',
    transferId: 't4',
    account: 'Primary Checking',
    debit: null,
    credit: 800,
    balance: 24450.75,
    description: 'Emergency fund received',
    timestamp: '2026-07-09T11:20:00Z',
  },
]

export const ledgerAudit: LedgerAudit = {
  balanced: true,
  totalDebits: 237571.25,
  totalCredits: 237571.25,
  entriesCount: 8,
  lastVerified: '2026-07-13T04:00:00Z',
}

export function getWalletName(id: string) {
  return wallets.find((w) => w.id === id)?.name ?? 'Unknown'
}

export function getTotalBalance() {
  return wallets.reduce((sum, w) => sum + w.available, 0)
}
