import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../../types'

const TOKEN_KEY = 'ledger_token'
const USER_KEY = 'ledger_user'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

function loadStoredAuth(): Pick<AuthState, 'user' | 'token'> {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const userRaw = localStorage.getItem(USER_KEY)
    const user = userRaw ? (JSON.parse(userRaw) as User) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

const stored = loadStoredAuth()

const initialState: AuthState = {
  user: stored.user,
  token: stored.token,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setCredentials(
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) {
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem(TOKEN_KEY, action.payload.token)
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload))
    },
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      // legacy session cleanup
      localStorage.removeItem('ledger_session')
    },
  },
})

export const { setLoading, setCredentials, setUser, logout } = authSlice.actions
export default authSlice.reducer
