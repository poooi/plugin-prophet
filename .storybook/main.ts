import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'
import { fileURLToPath } from 'url'

const storybookDir = path.dirname(fileURLToPath(import.meta.url))

export const storybookPathModulePattern = /^(?:\.\/path|.*[\\/]utils[\\/]path(?:\.ts)?)$/
export const storybookPoiAssetsModulePattern = /^.*[\\/]host[\\/]poi-assets(?:\.ts)?$/

const aliasEntries = (alias: NonNullable<StorybookConfig['viteFinal']> extends (...args: infer Args) => unknown
  ? Args[0]['resolve'] extends { alias?: infer Alias }
    ? Alias
    : never
  : never) => {
  if (Array.isArray(alias)) return alias
  return Object.entries(alias ?? {}).map(([find, replacement]) => ({ find, replacement }))
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {},
  viteFinal: async (config) => {
    const aliases = aliasEntries(config.resolve?.alias)
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: [
          ...aliases,
          { find: 'views/env-parts/i18next', replacement: path.resolve(storybookDir, './mocks/i18next.ts') },
          { find: storybookPathModulePattern, replacement: path.resolve(storybookDir, './mocks/path.ts') },
          { find: storybookPoiAssetsModulePattern, replacement: path.resolve(storybookDir, './mocks/poi-assets.ts') },
        ],
      },
    }
  },
}

export default config
