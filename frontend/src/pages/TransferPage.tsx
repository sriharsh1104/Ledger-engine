import { TransferForm } from '../components/dashboard/TransferForm'
import { RecentTransactions } from '../components/dashboard/RecentTransactions'

export function TransferPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Transfer Funds</h1>
        <p className="text-slate-400 mt-1">Move money between your accounts securely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransferForm />
        <RecentTransactions />
      </div>
    </div>
  )
}
