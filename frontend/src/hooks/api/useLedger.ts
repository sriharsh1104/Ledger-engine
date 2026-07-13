import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ledgerService } from '../../services/ledger.service'
import { queryKeys } from '../../lib/queryKeys'
import type { LedgerEntriesParams } from '../../api/types'

function unwrap<T>(res: { data: { data: T } }) {
  return res.data.data
}

export function useLedgerAudit() {
  return useQuery({
    queryKey: queryKeys.ledger.audit,
    queryFn: async () => unwrap(await ledgerService.getAudit()),
  })
}

export function useLedgerEntries(params?: LedgerEntriesParams) {
  return useQuery({
    queryKey: queryKeys.ledger.entries(params),
    queryFn: async () => unwrap(await ledgerService.getEntries(params)),
  })
}

export function useRunLedgerAudit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => unwrap(await ledgerService.runAudit()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.audit })
      queryClient.invalidateQueries({ queryKey: ['ledger', 'entries'] })
    },
  })
}
