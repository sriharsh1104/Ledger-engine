import { useQuery } from '@tanstack/react-query'
import { walletService } from '../../services/wallet.service'
import { queryKeys } from '../../lib/queryKeys'

function unwrap<T>(res: { data: { data: T } }) {
  return res.data.data
}

export function useWallets() {
  return useQuery({
    queryKey: queryKeys.wallets.all,
    queryFn: async () => unwrap(await walletService.getAll()),
  })
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: queryKeys.wallets.detail(id),
    queryFn: async () => unwrap(await walletService.getById(id)),
    enabled: !!id,
  })
}

export function useWalletBalance(id: string) {
  return useQuery({
    queryKey: queryKeys.wallets.balance(id),
    queryFn: async () => unwrap(await walletService.getBalance(id)),
    enabled: !!id,
    refetchInterval: 30_000,
  })
}
