import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProviders } from './providers/AppProviders'
import { ThemeProvider } from './context/ThemeContext'
import { Web3Provider } from './providers/Web3Provider'
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AppKitThemeSync } from './components/wallet/AppKitThemeSync'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { DashboardOverview } from './pages/DashboardOverview'
import { TransferPage } from './pages/TransferPage'
import { LedgerPage } from './pages/LedgerPage'
import { ProfilePage } from './pages/ProfilePage'
import { TwoFactorPage } from './pages/TwoFactorPage'
import { AssistantPage } from './pages/AssistantPage'
import { ChatPage } from './pages/ChatPage'
import { ChatWidget } from './components/chat/ChatWidget'

export default function App() {
  return (
    <AppProviders>
      <ThemeProvider>
        <Web3Provider>
          <AppKitThemeSync />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/messages" replace />} />

              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/messages" element={<ChatPage />} />
                  <Route path="/dashboard" element={<DashboardOverview />} />
                  <Route path="/transfer" element={<TransferPage />} />
                  <Route path="/ledger" element={<LedgerPage />} />
                  <Route path="/assistant" element={<AssistantPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/security/2fa" element={<TwoFactorPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/messages" replace />} />
            </Routes>
            <ChatWidget />
          </BrowserRouter>
        </Web3Provider>
      </ThemeProvider>
    </AppProviders>
  )
}
