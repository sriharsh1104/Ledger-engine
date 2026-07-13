import { Wallet, TrendingUp, Clock } from 'lucide-react'
import { wallets, getTotalBalance } from '../../lib/mockData'
import { formatCurrency } from '../../lib/format'
import { Card } from '../ui/Card'

export function WalletCards() {
  const total = getTotalBalance()

  return (
    <div className="space-y-6">
      <Card glow className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm text-slate-400 mb-1">Total Balance</p>
        <p className="text-4xl font-bold text-white tracking-tight">{formatCurrency(total)}</p>
        <div className="flex items-center gap-2 mt-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-sm text-accent">+4.2% this month</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {wallets.map((wallet, i) => (
          <Card
            key={wallet.id}
            className="animate-fade-in hover:border-accent/30 transition-colors duration-300"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-accent" />
              </div>
              <span className="text-xs text-slate-500 font-mono">{wallet.accountNumber}</span>
            </div>
            <h4 className="text-sm text-slate-400 mb-1">{wallet.name}</h4>
            <p className="text-2xl font-bold text-white">{formatCurrency(wallet.available)}</p>
            {wallet.pending > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-warning">
                <Clock className="w-3 h-3" />
                {formatCurrency(wallet.pending)} pending
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
