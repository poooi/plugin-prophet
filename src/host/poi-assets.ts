import path from 'path'

export const resolvePoiHostAssetPath = (...parts: string[]): string =>
  path.resolve(window.ROOT, ...parts)

export const isPoiDarkTheme = (): boolean => Boolean(window.isDarkTheme)
