import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '../../services/auth.service'
import { queryKeys } from '../../lib/queryKeys'
import { useAppDispatch } from '../../store/hooks'
import { setCredentials, setLoading, logout as logoutAction } from '../../store/slices/authSlice'
import type { LoginRequest, SignupRequest, ForgotPasswordRequest, ChangePasswordRequest } from '../../api/types'

function unwrap<T>(res: { data: { data: T } }) {
  return res.data.data
}

export function useLogin() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      dispatch(setLoading(true))
      const res = await authService.login(data)
      return unwrap(res)
    },
    onSuccess: (data) => {
      dispatch(setCredentials(data))
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
    onSettled: () => dispatch(setLoading(false)),
  })
}

export function useSignup() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      dispatch(setLoading(true))
      const res = await authService.signup(data)
      return unwrap(res)
    },
    onSuccess: (data) => {
      dispatch(setCredentials(data))
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
    onSettled: () => dispatch(setLoading(false)),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const res = await authService.forgotPassword(data)
      return unwrap(res)
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const res = await authService.changePassword(data)
      return unwrap(res)
    },
  })
}

export function useLogout() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  return () => {
    dispatch(logoutAction())
    queryClient.clear()
  }
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => unwrap(await authService.me()),
    enabled,
    staleTime: 5 * 60_000,
  })
}
