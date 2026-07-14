import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen'

export function ProtectedRoute() {
  const { isAuthenticated, isAuthReady } = useAuth()
  if (!isAuthReady) return <AuthLoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicRoute() {
  const { isAuthenticated, isAuthReady } = useAuth()
  if (!isAuthReady) return <AuthLoadingScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
