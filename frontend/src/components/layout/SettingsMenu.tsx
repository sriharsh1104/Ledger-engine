import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Settings, User, Shield, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ConfirmModal } from '../ui/Modal'
import { ChangePasswordModal } from '../security/ChangePasswordModal'
import { getSecuritySettings } from '../../lib/security'

type SettingsTab = 'profile' | 'security'

interface SettingsMenuProps {
  onLogout: () => void
}

export function SettingsMenu({ onLogout }: SettingsMenuProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (user) {
      setTwoFactorEnabled(getSecuritySettings(user.id).twoFactorEnabled)
    }
  }, [user, open])

  useEffect(() => {
    if (!open || !buttonRef.current) return
    function updatePosition() {
      const rect = buttonRef.current!.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleLogoutClick() {
    setOpen(false)
    setShowLogoutModal(true)
  }

  function goToProfile() {
    setOpen(false)
    navigate('/profile')
  }

  function openPasswordModal() {
    setOpen(false)
    setShowPasswordModal(true)
  }

  function open2FAModal() {
    setOpen(false)
    navigate('/security/2fa')
  }

  function confirmLogout() {
    setShowLogoutModal(false)
    onLogout()
  }

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          ref={buttonRef}
          onClick={() => setOpen((v) => !v)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            open
              ? 'text-white bg-surface-overlay'
              : 'text-slate-400 hover:text-white hover:bg-surface-overlay'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {open &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{ top: menuPos.top, right: menuPos.right }}
              className="fixed w-80 glass-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden animate-fade-in z-[200]"
            >
              <div className="flex border-b border-border-subtle">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'text-accent bg-accent/5 border-b-2 border-accent'
                        : 'text-slate-400 hover:text-white hover:bg-surface-overlay/50'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === 'profile' && (
                  <button
                    onClick={goToProfile}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-overlay transition-colors cursor-pointer animate-fade-in text-left"
                  >
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      {user?.phoneNumber && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {user.phoneCode} {user.phoneNumber}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Account secured</span>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={open2FAModal}
                        className="flex justify-between items-center w-full py-2.5 px-3 rounded-xl bg-surface-overlay text-xs
                          hover:bg-surface-overlay/80 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-400">Two-factor auth</span>
                        <span className={twoFactorEnabled ? 'text-accent font-medium' : 'text-accent hover:underline'}>
                          {twoFactorEnabled ? 'Enabled' : 'Enable'}
                        </span>
                      </button>
                      <div className="flex justify-between items-center py-2.5 px-3 rounded-xl bg-surface-overlay text-xs">
                        <span className="text-slate-400">Last login</span>
                        <span className="text-slate-300">Today</span>
                      </div>
                      <button
                        onClick={openPasswordModal}
                        className="flex justify-between items-center w-full py-2.5 px-3 rounded-xl bg-surface-overlay text-xs
                          hover:bg-surface-overlay/80 transition-colors cursor-pointer"
                      >
                        <span className="text-slate-400">Password</span>
                        <span className="text-accent hover:underline">Change</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border-subtle p-2">
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-slate-400
                    hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>,
            document.body,
          )}
      </div>

      <ConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Sign out"
        message="Do you want to logout?"
        confirmLabel="Yes"
        cancelLabel="No"
      />

      {user && (
        <ChangePasswordModal
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userId={user.id}
        />
      )}
    </>
  )
}
