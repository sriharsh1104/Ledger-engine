import { type ReactNode, useEffect } from 'react'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from '../store'
import { queryClient } from '../lib/queryClient'
import { useAppDispatch } from '../store/hooks'
import { setCredentials } from '../store/slices/authSlice'
import { getSession } from '../lib/auth'
import { AuthBootstrap } from '../components/auth/AuthBootstrap'

function LegacyAuthMigration({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const { token, user } = store.getState().auth
    if (token || user) return

    const legacy = getSession()
    if (legacy) {
      dispatch(setCredentials({ token: legacy.token, user: legacy.user }))
    }
  }, [dispatch])

  return children
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <LegacyAuthMigration>
          <AuthBootstrap>{children}</AuthBootstrap>
        </LegacyAuthMigration>
      </QueryClientProvider>
    </Provider>
  )
}
