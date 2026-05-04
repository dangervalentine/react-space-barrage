import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/react-space-barrage/',
  build: {
    outDir: 'build',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['node_modules', 'dist', 'build', 'src/engine/*.test.ts', '.claude'],
  },
})
