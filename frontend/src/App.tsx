import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { WalletProvider } from './context/WalletContext'
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { DashboardOverview } from './pages/DashboardOverview'
import { TransferPage } from './pages/TransferPage'
import { LedgerPage } from './pages/LedgerPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/transfer" element={<TransferPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
