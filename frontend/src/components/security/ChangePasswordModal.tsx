import { useState, type FormEvent } from 'react'
import { CheckCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../hooks/useAuth'

interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { changePassword, isLoading } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function reset() {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError('')
    setSuccess(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (next.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    if (next !== confirm) {
      setError('Passwords do not match')
      return
    }

    try {
      await changePassword(current, next)
      setSuccess(true)
      setTimeout(() => handleClose(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Change Password" size="md">
      {success ? (
        <div className="text-center py-6 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-accent" />
          </div>
          <p className="text-white font-medium">Password updated successfully</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Current password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Min. 6 characters"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Update Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
