import { apiClient } from '../api/client'
import type { ApiResponse, LedgerEntriesParams } from '../api/types'
import type { LedgerAudit, LedgerEntry } from '../types'

export const ledgerService = {
  getAudit: () => apiClient.get<ApiResponse<LedgerAudit>>('/ledger/audit'),

  getEntries: (params?: LedgerEntriesParams) =>
    apiClient.get<ApiResponse<LedgerEntry[]>>('/ledger/entries', { params }),

  runAudit: () =>
    apiClient.post<ApiResponse<LedgerAudit>>('/ledger/audit/run'),
}
