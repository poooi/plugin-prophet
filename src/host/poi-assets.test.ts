import { afterEach, describe, expect, it } from 'vitest'

import { isPoiDarkTheme, resolvePoiHostAssetPath } from './poi-assets'

describe('poi asset facade', () => {
  afterEach(() => {
    window.ROOT = ''
    window.isDarkTheme = undefined
  })

  it('normalizes Windows roots and relative asset parts without collapsing URL separators', () => {
    window.ROOT = 'file:///C:\\poi\\app\\'

    expect(resolvePoiHostAssetPath('./assets\\img/airplane/alv1.png')).toBe(
      'file:///C:/poi/app/assets/img/airplane/alv1.png',
    )
  })

  it('preserves dark theme state as a boolean', () => {
    expect(isPoiDarkTheme()).toBe(false)
    window.isDarkTheme = true
    expect(isPoiDarkTheme()).toBe(true)
  })
})
