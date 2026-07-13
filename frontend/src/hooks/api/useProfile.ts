import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../../services/profile.service'
import { queryKeys } from '../../lib/queryKeys'
import { useAppDispatch } from '../../store/hooks'
import { setUser } from '../../store/slices/authSlice'
import type { ProfileUpdate } from '../../types'

function unwrap<T>(res: { data: { data: T } }) {
  return res.data.data
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: async () => unwrap(await profileService.get()),
    staleTime: 2 * 60_000,
  })
}

export function useUpdateProfile() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProfileUpdate) =>
      unwrap(await profileService.update(data)),
    onSuccess: (user) => {
      dispatch(setUser(user))
      queryClient.setQueryData(queryKeys.profile.me, user)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}
