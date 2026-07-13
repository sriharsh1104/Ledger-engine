import { useState, useMemo, useEffect, type FormEvent } from 'react'
import { Shield, CheckCircle, QrCode, KeyRound, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { copyToClipboard } from '../../lib/format'
import { generateTotpSecret, buildOtpAuthUrl, verifyTotpToken } from '../../lib/totp'
import { QrScanPanel, ManualKeyPanel } from './QrScanPanel'
import {
  getSecuritySettings,
  enableTwoFactor,
  disableTwoFactor,
} from '../../lib/security'

type SetupMethod = 'qr' | 'manual'
type Step = 'choose' | 'verify' | 'enabled'

interface TwoFactorSetupProps {
  userId: string
  email: string
  onUpdated?: () => void
  onClose?: () => void
  showClose?: boolean
}

const STEPS = [
  { num: 1, label: 'Choose method' },
  { num: 2, label: 'Scan or enter key' },
  { num: 3, label: 'Verify code' },
]

export function TwoFactorSetup({
  userId,
  email,
  onUpdated,
  onClose,
  showClose = false,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<Step>('choose')
  const [method, setMethod] = useState<SetupMethod>('qr')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const s = getSecuritySettings(userId)
    if (s.twoFactorEnabled) {
      setStep('enabled')
    } else {
      setStep('choose')
      setSecret(generateTotpSecret())
    }
    setCode('')
    setError('')
  }, [userId])

  const otpAuthUrl = useMemo(
    () => (secret ? buildOtpAuthUrl(email, secret) : ''),
    [email, secret],
  )

  const currentStepNum = step === 'choose' ? 2 : step === 'verify' ? 3 : 0

  async function handleCopySecret() {
    const ok = await copyToClipboard(secret)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError('')

    const valid = await verifyTotpToken(code, secret)
    if (!valid) {
      setError('Invalid code. Open your authenticator app and enter the current 6-digit code.')
      return
    }

    setLoading(true)
    try {
      await enableTwoFactor(userId, secret)
      setStep('enabled')
      onUpdated?.()
    } catch {
      setError('Failed to enable 2FA. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setLoading(true)
    try {
      await disableTwoFactor(userId)
      onUpdated?.()
      setStep('choose')
      setSecret(generateTotpSecret())
      onClose?.()
    } finally {
      setLoading(false)
    }
  }

  if (step === 'enabled') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-accent/10 border border-accent/20">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">2FA is active</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Protected with Google Authenticator or compatible app
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          {showClose && (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
          <Button variant="danger" onClick={handleDisable} loading={loading}>
            Disable 2FA
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${currentStepNum >= s.num ? 'bg-accent text-white' : 'bg-surface-overlay text-slate-500'}`}
              >
                {s.num}
              </div>
              <span
                className={`text-xs hidden sm:block ${currentStepNum >= s.num ? 'text-white' : 'text-slate-500'}`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 ml-auto" />
              )}
            </div>
          ))}
        </div>

      {step === 'choose' && (
        <>
          <div className="flex items-center gap-2 text-accent">
            <Shield className="w-5 h-5" />
            <h3 className="font-semibold text-white">Enable Two-Factor Authentication</h3>
          </div>
          <p className="text-sm text-slate-400">
            Add an extra layer of security. Choose how you want to set up your authenticator app.
          </p>

          {/* Method tabs */}
          <div className="flex gap-2 p-1 rounded-xl bg-surface-overlay border border-border-subtle">
            <button
              type="button"
              onClick={() => setMethod('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${method === 'qr' ? 'bg-accent text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <QrCode className="w-4 h-4" />
              Scan QR Code
            </button>
            <button
              type="button"
              onClick={() => setMethod('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${method === 'manual' ? 'bg-accent text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <KeyRound className="w-4 h-4" />
              Manual Key
            </button>
          </div>

          {method === 'qr' ? (
            <QrScanPanel otpAuthUrl={otpAuthUrl} email={email} />
          ) : (
            <ManualKeyPanel secret={secret} copied={copied} onCopy={handleCopySecret} />
          )}

          <Button className="w-full" size="lg" onClick={() => setStep('verify')}>
            I've set up my authenticator — Continue
          </Button>
        </>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <h3 className="font-semibold text-white mb-1">Verify your setup</h3>
            <p className="text-sm text-slate-400">
              Enter the 6-digit code shown in your authenticator app
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Authentication code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="• • • • • •"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            className="font-mono text-center text-2xl tracking-[0.5em]"
          />

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep('choose')}>
              Back
            </Button>
            <Button type="submit" className="flex-1" loading={loading} disabled={code.length !== 6}>
              Enable 2FA
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
