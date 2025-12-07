
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true, // This exposes the app to the network
    proxy: {
        '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false
        },
        '/socket.io': {
            target: 'http://localhost:3001',
            ws: true,
            changeOrigin: true,
            secure: false
        }
    }
  }
})
