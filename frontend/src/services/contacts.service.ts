import { apiClient } from '../api/client'
import type { ApiResponse } from '../api/types'
import type { User } from '../types'

export interface UsersSearchData {
  users: User[]
}

export interface ContactsListData {
  contacts: User[]
}

export const contactsService = {
  searchUsers: (q: string, limit = 20) =>
    apiClient.get<ApiResponse<UsersSearchData>>('/users/search', {
      params: { q, limit },
    }),

  listContacts: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<ContactsListData>>('/contacts', { params }),

  searchContacts: (q: string, limit = 20) =>
    apiClient.get<ApiResponse<ContactsListData>>('/contacts/search', {
      params: { q, limit },
    }),

  addContact: (contactUserId: string) =>
    apiClient.post<ApiResponse<User>>('/contacts', { contactUserId }),

  removeContact: (contactUserId: string) =>
    apiClient.delete<ApiResponse<unknown>>(`/contacts/${contactUserId}`),
}
