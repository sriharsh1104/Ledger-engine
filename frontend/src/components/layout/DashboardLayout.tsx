import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Shield,
  LayoutDashboard,
  ArrowLeftRight,
  BookOpen,
  Bell,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SettingsMenu } from './SettingsMenu'
import { ThemeToggle } from '../ui/ThemeToggle'
import { HeaderWalletButton } from '../wallet/HeaderWalletButton'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/ledger', label: 'Ledger Audit', icon: BookOpen },
]

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen gradient-mesh flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-raised border-r border-border-subtle
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Ledger Engine</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Banking</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-overlay'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 px-2 w-full rounded-xl hover:bg-surface-overlay py-2 transition-colors cursor-pointer"
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-50 shrink-0 h-16 border-b border-border-subtle flex items-center justify-between px-4 lg:px-8 bg-surface/80 backdrop-blur-sm">
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <HeaderWalletButton />

            <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-surface-overlay transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            </button>

            <ThemeToggle />
            <SettingsMenu onLogout={handleLogout} />
          </div>
        </header>

        <main className="relative z-0 flex-1 p-4 lg:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  )
}
