import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Always proxy to HTTP. Vite upgrades /ws with `ws: true`.
// Using `ws://` as target causes ECONNRESET / flaky chat realtime.
const apiTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8088'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/ws': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
