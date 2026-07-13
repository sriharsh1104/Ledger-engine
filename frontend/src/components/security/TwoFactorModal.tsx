import { Modal } from '../ui/Modal'
import { TwoFactorSetup } from './TwoFactorSetup'

interface TwoFactorModalProps {
  open: boolean
  onClose: () => void
  userId: string
  email: string
  onUpdated: () => void
}

export function TwoFactorModal({ open, onClose, userId, email, onUpdated }: TwoFactorModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Two-Factor Authentication" size="lg">
      <TwoFactorSetup
        userId={userId}
        email={email}
        onUpdated={onUpdated}
        onClose={onClose}
        showClose
      />
    </Modal>
  )
}
