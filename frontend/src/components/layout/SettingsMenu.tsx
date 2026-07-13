import { useState, useRef, useEffect } from 'react'
import { Settings, User, Shield, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ConfirmModal } from '../ui/Modal'

type SettingsTab = 'profile' | 'security'

interface SettingsMenuProps {
  onLogout: () => void
}

export function SettingsMenu({ onLogout }: SettingsMenuProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleLogoutClick() {
    setOpen(false)
    setShowLogoutModal(true)
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

        {open && (
          <div className="absolute right-0 top-full mt-2 w-72 glass-card rounded-2xl shadow-2xl border border-border-subtle overflow-hidden animate-fade-in z-50">
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
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border-subtle">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Account ID</span>
                      <span className="text-slate-300 font-mono">{user?.id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Member since</span>
                      <span className="text-slate-300">Jul 2026</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Account secured</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-surface-overlay text-xs">
                      <span className="text-slate-400">Two-factor auth</span>
                      <span className="text-slate-500">Not enabled</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-surface-overlay text-xs">
                      <span className="text-slate-400">Last login</span>
                      <span className="text-slate-300">Today</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-surface-overlay text-xs">
                      <span className="text-slate-400">Password</span>
                      <span className="text-accent cursor-pointer hover:underline">Change</span>
                    </div>
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
          </div>
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
    </>
  )
}
