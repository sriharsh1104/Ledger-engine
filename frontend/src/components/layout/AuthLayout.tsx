import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen gradient-mesh flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-blue-500/5" />
        <div className="relative z-10 max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Ledger Engine</h1>
              <p className="text-sm text-slate-400">Double-entry financial ledger</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Money handled with mathematical certainty
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Atomic transactions, deterministic double-entry bookkeeping, and real-time balance audits —
            built for digital wallets and banking at scale.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Uptime', value: '99.99%' },
              { label: 'Transactions', value: '2.4M+' },
              { label: 'Audit accuracy', value: '100%' },
              { label: 'Settlement', value: '<50ms' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4">
                <p className="text-2xl font-bold text-accent">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Ledger Engine</span>
          </div>
          {children}
          <p className="text-center text-xs text-slate-500 mt-8">
            Secured by double-entry ledger verification
          </p>
        </div>
      </div>
    </div>
  )
}

export function AuthFooter({ text, linkText, to }: { text: string; linkText: string; to: string }) {
  return (
    <p className="text-center text-sm text-slate-400 mt-6">
      {text}{' '}
      <Link to={to} className="text-accent hover:text-accent-hover font-medium transition-colors">
        {linkText}
      </Link>
    </p>
  )
}
