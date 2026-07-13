import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transferService } from '../../services/transfer.service'
import { queryKeys } from '../../lib/queryKeys'
import type { CreateTransferRequest, PaginatedParams } from '../../api/types'

function unwrap<T>(res: { data: { data: T } }) {
  return res.data.data
}

export function useTransfers(params?: PaginatedParams) {
  return useQuery({
    queryKey: queryKeys.transfers.all(params),
    queryFn: async () => unwrap(await transferService.getAll(params)),
  })
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTransferRequest) =>
      unwrap(await transferService.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger.audit })
      queryClient.invalidateQueries({ queryKey: ['ledger', 'entries'] })
    },
  })
}
