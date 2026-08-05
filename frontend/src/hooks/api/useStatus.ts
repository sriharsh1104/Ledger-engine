import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../../services/users.service'
import { queryKeys } from '../../lib/queryKeys'
import { unwrapApiData } from '../../lib/apiUtils'
import { normalizeUserStatus } from '../../lib/status'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setUser } from '../../store/slices/authSlice'
import type { UserStatus } from '../../types'

function extractMyStatus(data: unknown): UserStatus {
  if (typeof data === 'string') {
    return normalizeUserStatus(data) ?? 'offline'
  }
  if (data && typeof data === 'object') {
    const obj = data as { status?: unknown }
    return normalizeUserStatus(obj.status) ?? 'offline'
  }
  return 'offline'
}

/** Normalize batch status payload into userId → status map. */
export function extractStatusMap(data: unknown): Record<string, UserStatus> {
  if (!data || typeof data !== 'object') return {}
  const obj = data as Record<string, unknown>

  if (obj.statuses && typeof obj.statuses === 'object' && !Array.isArray(obj.statuses)) {
    return mapStatusRecord(obj.statuses as Record<string, unknown>)
  }
  if (Array.isArray(obj.statuses)) {
    return mapStatusList(obj.statuses)
  }
  if (Array.isArray(obj.users)) {
    return mapStatusList(obj.users)
  }
  if (Array.isArray(data)) {
    return mapStatusList(data)
  }
  return mapStatusRecord(obj)
}

function mapStatusRecord(record: Record<string, unknown>): Record<string, UserStatus> {
  const out: Record<string, UserStatus> = {}
  for (const [id, value] of Object.entries(record)) {
    if (id === 'statuses' || id === 'users' || id === 'data') continue
    const status =
      typeof value === 'string'
        ? normalizeUserStatus(value)
        : value && typeof value === 'object'
          ? normalizeUserStatus((value as { status?: unknown }).status)
          : undefined
    if (status) out[id] = status
  }
  return out
}

function mapStatusList(list: unknown[]): Record<string, UserStatus> {
  const out: Record<string, UserStatus> = {}
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as { id?: string; userId?: string; status?: unknown }
    const id = row.id || row.userId
    const status = normalizeUserStatus(row.status)
    if (id && status) out[id] = status
  }
  return out
}

export function useMyStatus(enabled = true) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const query = useQuery({
    queryKey: queryKeys.users.myStatus,
    enabled: enabled && !!user,
    queryFn: async () => {
      const res = await usersService.getMyStatus()
      return extractMyStatus(unwrapApiData(res))
    },
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!query.data || !user) return
    if (user.status === query.data) return
    dispatch(setUser({ ...user, status: query.data }))
  }, [query.data, user, dispatch])

  return {
    ...query,
    status: query.data ?? normalizeUserStatus(user?.status) ?? 'offline',
  }
}

export function useUpdateMyStatus() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const user = useAppSelector((s) => s.auth.user)

  return useMutation({
    mutationFn: async (status: UserStatus) => {
      const res = await usersService.updateMyStatus(status)
      return extractMyStatus(unwrapApiData(res)) || status
    },
    onSuccess: (status) => {
      queryClient.setQueryData(queryKeys.users.myStatus, status)
      if (user) {
        dispatch(setUser({ ...user, status }))
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me })
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

/** Batch fetch presence for a list of user ids. */
export function useUsersStatus(ids: string[], enabled = true) {
  const key = useMemo(
    () => [...new Set(ids.filter(Boolean))].sort().join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: stabilize by content
    [ids.join(',')],
  )
  const unique = useMemo(
    () => (key ? key.split(',') : []),
    [key],
  )

  return useQuery({
    queryKey: queryKeys.users.statusBatch(unique),
    enabled: enabled && unique.length > 0,
    queryFn: async () => {
      const res = await usersService.getUsersStatus(unique)
      return extractStatusMap(unwrapApiData(res))
    },
    staleTime: 20_000,
  })
}

/** Resolve status: prefer embedded user.status, then batch map. */
export function resolveUserStatus(
  userId: string | undefined,
  embedded: UserStatus | undefined,
  batch?: Record<string, UserStatus>,
): UserStatus | undefined {
  if (embedded) return embedded
  if (userId && batch?.[userId]) return batch[userId]
  return undefined
}
