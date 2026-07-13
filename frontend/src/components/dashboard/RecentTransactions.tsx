import { transfers, getWalletName } from '../../lib/mockData'
import { formatCurrency, formatRelativeDate } from '../../lib/format'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { ArrowUpRight, ArrowDownLeft, Clock, XCircle } from 'lucide-react'

const statusConfig = {
  completed: { icon: ArrowUpRight, color: 'text-accent', bg: 'bg-accent/10', label: 'Completed' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', label: 'Failed' },
}

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>

      <div className="space-y-1">
        {transfers.map((tx, i) => {
          const config = statusConfig[tx.status]
          const StatusIcon = config.icon
          return (
            <div
              key={tx.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-overlay transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                {tx.status === 'completed' ? (
                  <ArrowDownLeft className={`w-4 h-4 ${config.color}`} />
                ) : (
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{tx.memo}</p>
                <p className="text-xs text-slate-500">
                  {getWalletName(tx.fromWalletId)} → {getWalletName(tx.toWalletId)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">{formatCurrency(tx.amount)}</p>
                <p className="text-xs text-slate-500">{formatRelativeDate(tx.createdAt)}</p>
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${config.color} hidden sm:block`}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
