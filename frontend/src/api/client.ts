import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { Store } from '@reduxjs/toolkit'
import { logout } from '../store/slices/authSlice'
import { config } from '../lib/config'
import type { ApiError } from './types'

export const API_BASE_URL = config.apiBaseUrl

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/forgot-password'] as const

function isPublicAuthRequest(url: string | undefined) {
  if (!url) return false
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path))
}

export function setupApiInterceptors(store: Store) {
  apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (isPublicAuthRequest(config.url)) return config

    const token = store.getState().auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401) {
        store.dispatch(logout())
      }
      const message =
        error.response?.data?.message ??
        error.message ??
        'Something went wrong'
      return Promise.reject(new Error(message))
    },
  )
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
