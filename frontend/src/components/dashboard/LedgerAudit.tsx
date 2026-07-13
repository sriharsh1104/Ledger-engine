import { useState } from 'react'
import { ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react'
import { ledgerEntries, ledgerAudit } from '../../lib/mockData'
import { formatCurrency, formatDate } from '../../lib/format'
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'

export function LedgerAuditPanel() {
  const [auditing, setAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState(ledgerAudit)

  async function runAudit() {
    setAuditing(true)
    await new Promise((r) => setTimeout(r, 1500))
    setAuditResult({ ...ledgerAudit, lastVerified: new Date().toISOString() })
    setAuditing(false)
  }

  return (
    <div className="space-y-6">
      <Card glow={auditResult.balanced}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                auditResult.balanced ? 'bg-accent/10' : 'bg-danger/10'
              }`}
            >
              {auditResult.balanced ? (
                <ShieldCheck className="w-7 h-7 text-accent" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-danger" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {auditResult.balanced ? 'Ledger Balanced' : 'Imbalance Detected'}
              </h3>
              <p className="text-sm text-slate-400">
                Last verified: {formatDate(auditResult.lastVerified)}
              </p>
            </div>
          </div>
          <Button onClick={runAudit} loading={auditing} variant="secondary">
            <RefreshCw className="w-4 h-4" />
            Run Audit
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Debits', value: formatCurrency(auditResult.totalDebits) },
            { label: 'Total Credits', value: formatCurrency(auditResult.totalCredits) },
            { label: 'Entries', value: auditResult.entriesCount.toString() },
            {
              label: 'Difference',
              value: formatCurrency(Math.abs(auditResult.totalDebits - auditResult.totalCredits)),
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-overlay rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-white font-mono">{stat.value}</p>
            </div>
          ))}
        </div>

        {auditResult.balanced && (
          <div className="flex items-center gap-2 mt-4 text-sm text-accent">
            <CheckCircle2 className="w-4 h-4" />
            Double-entry invariant holds: debits equal credits
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
          <CardDescription>Double-entry bookkeeping records for all transactions</CardDescription>
        </CardHeader>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Balance
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                  Description
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border-subtle/50 hover:bg-surface-overlay/50 transition-colors"
                >
                  <td className="py-3 px-2 text-white font-medium">{entry.account}</td>
                  <td className="py-3 px-2 text-right font-mono text-danger">
                    {entry.debit ? formatCurrency(entry.debit) : '—'}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-accent">
                    {entry.credit ? formatCurrency(entry.credit) : '—'}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-slate-300 hidden md:table-cell">
                    {formatCurrency(entry.balance)}
                  </td>
                  <td className="py-3 px-2 text-slate-400 hidden lg:table-cell">{entry.description}</td>
                  <td className="py-3 px-2 text-right text-slate-500 text-xs hidden sm:table-cell">
                    {formatDate(entry.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-3 px-2 text-white">Totals</td>
                <td className="py-3 px-2 text-right font-mono text-danger">
                  {formatCurrency(auditResult.totalDebits)}
                </td>
                <td className="py-3 px-2 text-right font-mono text-accent">
                  {formatCurrency(auditResult.totalCredits)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
