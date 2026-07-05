/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'test/**/*.test.ts', 'test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/host/types/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      'views/utils/selectors': '/test/mocks/poi-selectors.ts',
      'views/utils/game-utils': '/test/mocks/poi-game-utils.ts',
      'views/utils/tools': '/test/mocks/poi-tools.ts',
      'views/create-store': '/test/mocks/poi-store.ts',
      'views/env-parts/i18next': '/test/mocks/poi-i18next.ts',
      'views/components/etc/overlay': '/test/mocks/poi-overlay.ts',
      'views/components/etc/avatar': '/test/mocks/poi-avatar.ts',
      'views/components/etc/icon': '/test/mocks/poi-icon.ts',
    },
  },
})
