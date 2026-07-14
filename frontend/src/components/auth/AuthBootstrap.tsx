import { type ReactNode, useEffect } from 'react'
import { authService } from '../../services/auth.service'
import { config } from '../../lib/config'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout, setAuthReady, setUser } from '../../store/slices/authSlice'
import type { User } from '../../types'

function unwrapUser(res: { data: { data: User } }) {
  return res.data.data
}

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const isAuthReady = useAppSelector((s) => s.auth.isAuthReady)

  useEffect(() => {
    if (isAuthReady) return

    if (config.useMockApi) {
      dispatch(setAuthReady(true))
      return
    }

    if (!token) {
      dispatch(setAuthReady(true))
      return
    }

    let cancelled = false

    authService
      .me()
      .then((res) => {
        if (!cancelled) dispatch(setUser(unwrapUser(res)))
      })
      .catch(() => {
        if (!cancelled) dispatch(logout())
      })
      .finally(() => {
        if (!cancelled) dispatch(setAuthReady(true))
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, isAuthReady, token])

  return children
}
