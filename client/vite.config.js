import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// drop client — proxies /api to local Express server (see ../server)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
