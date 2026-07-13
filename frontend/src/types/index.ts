export interface User {
  id: string
  name: string
  email: string
  profileImage?: string
  phoneCode?: string
  phoneNumber?: string
}

export interface Wallet {
  id: string
  name: string
  currency: string
  available: number
  pending: number
  accountNumber: string
}

export interface Transfer {
  id: string
  fromWalletId: string
  toWalletId: string
  amount: number
  memo: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
}

export interface LedgerEntry {
  id: string
  transferId: string
  account: string
  debit: number | null
  credit: number | null
  balance: number
  description: string
  timestamp: string
}

export interface LedgerAudit {
  balanced: boolean
  totalDebits: number
  totalCredits: number
  entriesCount: number
  lastVerified: string
}

export interface PhoneCountry {
  code: string
  dial: string
  flag: string
  name: string
}

export interface ProfileUpdate {
  profileImage?: string
  phoneCode: string
  phoneNumber: string
}
