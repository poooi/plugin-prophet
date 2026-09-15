import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const configDir = path.dirname(fileURLToPath(import.meta.url))

// Modules Poi provides at runtime but that are not installed in this package.
// Tests always replace them with vi.mock factories; resolving them to a virtual
// id keeps Vite from failing on the missing import.
const hostOnlyModules = [
  'react-redux',
  'react-fontawesome',
  'views/utils/selectors',
  'views/components/etc/overlay',
]

const hostModuleStubPlugin = {
  name: 'prophet-host-module-stubs',
  enforce: 'pre' as const,
  resolveId(id: string): string | undefined {
    if (hostOnlyModules.includes(id)) return `\0prophet-host:${id}`
    return undefined
  },
  load(id: string): string | undefined {
    if (id.startsWith('\0prophet-host:')) return 'export default {}'
    return undefined
  },
}

export default defineConfig({
  plugins: [hostModuleStubPlugin],
  resolve: {
    alias: {
      'views/env-parts/i18next': path.resolve(configDir, './test/mocks/i18next.ts'),
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
