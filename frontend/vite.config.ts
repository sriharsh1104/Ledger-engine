import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Always proxy to HTTP. Vite upgrades /ws with `ws: true`.
const apiTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8088'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all interfaces so other devices can open http://<LAN-IP>:5173
    host: true,
    port: 5173,
    strictPort: true,
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
