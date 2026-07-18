import { describe, expect, it } from 'vitest'

import {
  storybookPathModulePattern,
  storybookPoiAssetsModulePattern,
} from './main'

describe('Storybook module aliases', () => {
  it.each([
    './path',
    '../utils/path',
    String.raw`C:\plugin\src\utils\path.ts`,
  ])('mocks the path module imported as %s', (specifier) => {
    expect(specifier).toMatch(storybookPathModulePattern)
  })

  it.each([
    '../host/poi-assets',
    '../../host/poi-assets',
    String.raw`C:\plugin\src\host\poi-assets.ts`,
  ])('mocks the Poi assets module imported as %s', (specifier) => {
    expect(specifier).toMatch(storybookPoiAssetsModulePattern)
  })
})
