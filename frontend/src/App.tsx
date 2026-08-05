import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProviders } from './providers/AppProviders'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { ForgotPassword } from './pages/ForgotPassword'
import { ProfilePage } from './pages/ProfilePage'
import { TwoFactorPage } from './pages/TwoFactorPage'
import { AssistantPage } from './pages/AssistantPage'
import { ChatPage } from './pages/ChatPage'
import { CallHistoryPage } from './pages/CallHistoryPage'
import { ChatWidget } from './components/chat/ChatWidget'

export default function App() {
  return (
    <AppProviders>
      <ThemeProvider>
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
                <Route path="/calls" element={<CallHistoryPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/security/2fa" element={<TwoFactorPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/messages" replace />} />
          </Routes>
          <ChatWidget />
        </BrowserRouter>
      </ThemeProvider>
    </AppProviders>
  )
}
