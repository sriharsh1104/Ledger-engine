import { useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { wallets } from '../../lib/mockData'
import { formatCurrency } from '../../lib/format'
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function TransferForm() {
  const [fromWallet, setFromWallet] = useState(wallets[0].id)
  const [toWallet, setToWallet] = useState(wallets[1].id)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const from = wallets.find((w) => w.id === fromWallet)
  const to = wallets.find((w) => w.id === toWallet)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (fromWallet === toWallet) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSuccess(true)
    setAmount('')
    setMemo('')
    setTimeout(() => setSuccess(false), 4000)
  }

  const selectClass =
    'w-full rounded-xl bg-surface-overlay border border-border px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent appearance-none cursor-pointer'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Money</CardTitle>
        <CardDescription>Move funds between your accounts instantly</CardDescription>
      </CardHeader>

      {success ? (
        <div className="text-center py-8 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          <p className="text-white font-medium text-lg">Transfer initiated</p>
          <p className="text-sm text-slate-400 mt-1">Your transaction is being processed</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">From account</label>
              <select value={fromWallet} onChange={(e) => setFromWallet(e.target.value)} className={selectClass}>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {formatCurrency(w.available)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">To account</label>
              <select value={toWallet} onChange={(e) => setToWallet(e.target.value)} className={selectClass}>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === fromWallet}>
                    {w.name} — {formatCurrency(w.available)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {from && to && (
            <div className="flex items-center justify-center gap-3 py-2">
              <span className="text-sm text-slate-400">{from.name}</span>
              <ArrowRight className="w-4 h-4 text-accent" />
              <span className="text-sm text-slate-400">{to.name}</span>
            </div>
          )}

          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Input
            label="Memo (optional)"
            type="text"
            placeholder="What's this transfer for?"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
            disabled={fromWallet === toWallet || !amount}
          >
            <ArrowRight className="w-4 h-4" />
            Transfer {amount ? formatCurrency(parseFloat(amount)) : 'funds'}
          </Button>
        </form>
      )}
    </Card>
  )
}
