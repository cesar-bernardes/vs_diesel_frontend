import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Isso força o Vite a usar sempre a mesma cópia do React
    dedupe: ['react', 'react-dom'],
  },
})