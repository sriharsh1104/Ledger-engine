import { useEffect, useState } from 'react'
import { Check, Copy, Link2, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useChannelInvite } from '../../hooks/api'
import { getApiErrorMessage } from '../../api/client'

interface GroupInviteModalProps {
  open: boolean
  onClose: () => void
  channelId: string | null
  channelName?: string
}

export function GroupInviteModal({
  open,
  onClose,
  channelId,
  channelName,
}: GroupInviteModalProps) {
  const inviteQuery = useChannelInvite(channelId, open && !!channelId)
  const invite = inviteQuery.data
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(null), 1800)
    return () => clearTimeout(t)
  }, [copied])

  async function copy(kind: 'code' | 'link', value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
    } catch {
      // ignore
    }
  }

  const code = invite?.inviteCode ?? ''
  const link = invite?.inviteUrl || undefined
  const qrValue = invite?.qrPayload || link || (code ? `ledger://invite/${code}` : '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={channelName ? `Invite · ${channelName}` : 'Group invite'}
      size="md"
    >
      {inviteQuery.isLoading ? (
        <p className="text-sm text-slate-400 py-6 text-center">Loading invite…</p>
      ) : inviteQuery.isError ? (
        <p className="text-sm text-danger py-4">
          {getApiErrorMessage(inviteQuery.error)}
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div className="rounded-2xl bg-white p-3 shrink-0">
              {qrValue ? (
                <QRCodeSVG value={qrValue} size={160} level="M" includeMargin />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                  <QrCode className="w-10 h-10" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-3 w-full">
              <p className="text-xs text-slate-400">
                Share the code, link, or QR so others can join this group.
              </p>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  Invite code
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate rounded-xl bg-surface-overlay border border-border-subtle px-3 py-2 text-sm text-accent font-mono">
                    {code || '—'}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!code}
                    onClick={() => void copy('code', code)}
                  >
                    {copied === 'code' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  Invite link
                </p>
                {link ? (
                  <div className="flex items-center gap-2">
                    <p className="flex-1 min-w-0 truncate rounded-xl bg-surface-overlay border border-border-subtle px-3 py-2 text-xs text-slate-300">
                      {link}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void copy('link', link)}
                    >
                      {copied === 'link' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 rounded-xl bg-surface-overlay border border-border-subtle px-3 py-2">
                    Link unavailable — gateway needs{' '}
                    <code className="text-slate-400">PUBLIC_APP_BASE_URL</code>.
                    QR still works with the app scheme.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
