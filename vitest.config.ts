import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      'views/env-parts/i18next': path.resolve(__dirname, './test/mocks/i18next.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'coverage/**',
        'node_modules/**',
        'shims/**',
        '*.config.*',
        '**/*.stories.*',
      ],
    },
  },
})
