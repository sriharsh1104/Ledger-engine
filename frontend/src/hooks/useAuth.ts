import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import {
  useLogin as useLoginMutation,
  useSignup as useSignupMutation,
  useForgotPassword as useForgotPasswordMutation,
  useLogout as useLogoutAction,
  useUpdateProfile as useUpdateProfileMutation,
} from './api'
import * as mockAuth from '../lib/auth'
import { updateProfile as updateProfileMock } from '../lib/profile'
import { useAppDispatch } from '../store/hooks'
import { setCredentials, setLoading, setUser } from '../store/slices/authSlice'
import { config } from '../lib/config'
import type { ProfileUpdate } from '../types'

export function useAuth() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const isLoading = useAppSelector((s) => s.auth.isLoading)
  const loginMutation = useLoginMutation()
  const signupMutation = useSignupMutation()
  const forgotMutation = useForgotPasswordMutation()
  const updateProfileMutation = useUpdateProfileMutation()
  const logoutAction = useLogoutAction()

  const login = useCallback(
    async (email: string, password: string) => {
      if (config.useMockApi) {
        dispatch(setLoading(true))
        try {
          const session = await mockAuth.login(email, password)
          dispatch(setCredentials({ user: session.user, token: session.token }))
        } finally {
          dispatch(setLoading(false))
        }
        return
      }
      await loginMutation.mutateAsync({ email, password })
    },
    [dispatch, loginMutation],
  )

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      if (config.useMockApi) {
        dispatch(setLoading(true))
        try {
          const session = await mockAuth.signup(name, email, password)
          dispatch(setCredentials({ user: session.user, token: session.token }))
        } finally {
          dispatch(setLoading(false))
        }
        return
      }
      await signupMutation.mutateAsync({ name, email, password })
    },
    [dispatch, signupMutation],
  )

  const forgotPassword = useCallback(
    async (email: string) => {
      if (config.useMockApi) {
        dispatch(setLoading(true))
        try {
          const result = await mockAuth.forgotPassword(email)
          return result.message
        } finally {
          dispatch(setLoading(false))
        }
      }
      const result = await forgotMutation.mutateAsync({ email })
      return result.message
    },
    [dispatch, forgotMutation],
  )

  const updateProfile = useCallback(
    async (data: ProfileUpdate) => {
      if (!user) return

      if (config.useMockApi) {
        dispatch(setLoading(true))
        try {
          const profile = await updateProfileMock(user.id, data)
          const updated = {
            ...user,
            profileImage: profile.profileImage,
            phoneCode: profile.phoneCode,
            phoneNumber: profile.phoneNumber,
          }
          mockAuth.refreshSessionUser(updated)
          dispatch(setUser(updated))
        } finally {
          dispatch(setLoading(false))
        }
        return
      }
      await updateProfileMutation.mutateAsync(data)
    },
    [dispatch, updateProfileMutation, user],
  )

  const logout = useCallback(() => {
    if (config.useMockApi) {
      mockAuth.logout()
    }
    logoutAction()
  }, [logoutAction])

  return {
    user,
    isAuthenticated: !!user,
    isLoading:
      isLoading ||
      loginMutation.isPending ||
      signupMutation.isPending ||
      forgotMutation.isPending ||
      updateProfileMutation.isPending,
    login,
    signup,
    forgotPassword,
    updateProfile,
    logout,
  }
}
