import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Hash, Users } from 'lucide-react'
import { useJoinByInviteCode, usePreviewInvite } from '../hooks/api'
import { getApiErrorMessage } from '../api/client'
import { Button } from '../components/ui/Button'

/** Deep-link landing: /invite/:code → preview + join group. */
export function InviteJoinPage() {
  const { code = '' } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const inviteCode = decodeURIComponent(code).trim()

  const preview = usePreviewInvite(inviteCode, !!inviteCode)
  const join = useJoinByInviteCode()
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
  }, [inviteCode])

  async function handleJoin() {
    if (!inviteCode) return
    setError('')
    try {
      const channel = await join.mutateAsync(inviteCode)
      navigate('/messages', { state: { selectChannelId: channel.id } })
    } catch (err) {
      setError(getApiErrorMessage(err))
    }
  }

  return (
    <div className="max-w-md mx-auto w-full animate-fade-in flex flex-col gap-6 py-10 px-4">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Group invite</h1>
        <p className="text-sm text-slate-400 mt-1">
          Preview and join with invite code
        </p>
      </div>

      {!inviteCode ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-8 text-center text-sm text-slate-400">
          Missing invite code
        </div>
      ) : preview.isLoading ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-8 text-center text-sm text-slate-400">
          Loading invite…
        </div>
      ) : preview.isError ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
          {getApiErrorMessage(preview.error)}
        </div>
      ) : preview.data ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <Hash className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-white truncate">
                {preview.data.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">
                {preview.data.visibility} group
              </p>
              <p className="text-xs text-slate-500 mt-2 inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {preview.data.memberCount} members
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono truncate">
            Code · {inviteCode}
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/messages')}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              loading={join.isPending}
              onClick={() => void handleJoin()}
            >
              Join group
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
