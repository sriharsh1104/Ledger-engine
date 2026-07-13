import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import { setupApiInterceptors } from '../api/client'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

setupApiInterceptors(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
