import { LedgerAuditPanel } from '../components/dashboard/LedgerAudit'

export function LedgerPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Ledger Audit</h1>
        <p className="text-slate-400 mt-1">
          Verify double-entry integrity — debits must always equal credits
        </p>
      </div>

      <LedgerAuditPanel />
    </div>
  )
}
