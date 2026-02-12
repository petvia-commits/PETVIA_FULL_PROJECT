import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['petvia.ihia.com.br','petvia.ihia.com.br:443','localhost']
  }
})
