import { QRCodeSVG } from 'qrcode.react'
import { Smartphone, ScanLine, KeyRound } from 'lucide-react'

interface QrScanPanelProps {
  otpAuthUrl: string
  email: string
}

const AUTH_APPS = ['Google Authenticator', 'Authy', 'Microsoft Authenticator', '1Password']

export function QrScanPanel({ otpAuthUrl, email }: QrScanPanelProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
        <Smartphone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="text-sm text-slate-400">
          <p className="text-white font-medium mb-1">Scan with your phone</p>
          <p>Open your authenticator app → tap <strong className="text-slate-300">+</strong> →{' '}
            <strong className="text-slate-300">Scan QR code</strong> → point camera at the code below
          </p>
        </div>
      </div>

      {/* Scanner frame */}
      <div className="relative mx-auto w-fit">
        <div className="relative p-5 rounded-2xl bg-white shadow-lg shadow-accent/10">
          {otpAuthUrl && <QRCodeSVG value={otpAuthUrl} size={220} level="H" includeMargin />}
          {/* Corner brackets */}
          <span className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-sm" />
          <span className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-sm" />
          <span className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-sm" />
          <span className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-sm" />
          {/* Scan line animation */}
          <div className="absolute inset-5 overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute left-0 right-0 h-0.5 bg-accent/60 animate-[scan_2s_ease-in-out_infinite]" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
          <ScanLine className="w-3.5 h-3.5 text-accent" />
          Scan to add <span className="text-slate-400 font-mono">{email}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {AUTH_APPS.map((app) => (
          <span
            key={app}
            className="px-2.5 py-1 rounded-lg bg-surface-overlay border border-border-subtle text-[10px] text-slate-400"
          >
            {app}
          </span>
        ))}
      </div>
    </div>
  )
}

interface ManualKeyPanelProps {
  secret: string
  copied: boolean
  onCopy: () => void
}

export function ManualKeyPanel({ secret, copied, onCopy }: ManualKeyPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-overlay border border-border-subtle">
        <KeyRound className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="text-sm text-slate-400">
          <p className="text-white font-medium mb-1">Enter key manually</p>
          <p>In your authenticator app, choose <strong className="text-slate-300">Enter setup key</strong> and paste this code</p>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-surface-overlay border border-border-subtle">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Setup key</p>
        <div className="flex items-center gap-2">
          <code className="text-sm text-accent font-mono flex-1 break-all leading-relaxed">{secret}</code>
          <button
            type="button"
            onClick={onCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer shrink-0"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
