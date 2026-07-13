import { useAuth } from '../hooks/useAuth'
import { WalletCards } from '../components/dashboard/WalletCards'
import { RecentTransactions } from '../components/dashboard/RecentTransactions'
import { TransferForm } from '../components/dashboard/TransferForm'

export function DashboardOverview() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-400 mt-1">Here's an overview of your accounts</p>
      </div>

      <WalletCards />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentTransactions />
        <TransferForm />
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
