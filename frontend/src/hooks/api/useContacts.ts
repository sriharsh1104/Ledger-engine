import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contactsService } from '../../services/contacts.service'
import { queryKeys } from '../../lib/queryKeys'
import { unwrapApiData } from '../../lib/apiUtils'
import type { User } from '../../types'

function extractUsers(data: unknown): User[] {
  if (!data) return []
  if (Array.isArray(data)) return data as User[]
  if (typeof data === 'object') {
    const obj = data as { users?: User[]; contacts?: User[] }
    if (Array.isArray(obj.users)) return obj.users
    if (Array.isArray(obj.contacts)) return obj.contacts
  }
  return []
}

export function useContacts(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: async () => {
      const res = await contactsService.listContacts(params ?? { limit: 50 })
      return extractUsers(unwrapApiData(res))
    },
  })
}

export function useSearchUsers(q: string, enabled = true) {
  const trimmed = q.trim()
  return useQuery({
    queryKey: queryKeys.contacts.userSearch(trimmed),
    enabled: enabled && trimmed.length >= 2,
    queryFn: async () => {
      const res = await contactsService.searchUsers(trimmed)
      return extractUsers(unwrapApiData(res))
    },
  })
}

export function useSearchContacts(q: string, enabled = true) {
  const trimmed = q.trim()
  return useQuery({
    queryKey: queryKeys.contacts.contactSearch(trimmed),
    enabled: enabled && trimmed.length >= 1,
    queryFn: async () => {
      const res = await contactsService.searchContacts(trimmed)
      return extractUsers(unwrapApiData(res))
    },
  })
}

export function useAddContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contactUserId: string) => {
      const res = await contactsService.addContact(contactUserId)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useRemoveContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contactUserId: string) => {
      const res = await contactsService.removeContact(contactUserId)
      return unwrapApiData(res)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
