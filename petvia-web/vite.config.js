import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['petvia.ihia.com.br']
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ['petvia.ihia.com.br']
  }
})
