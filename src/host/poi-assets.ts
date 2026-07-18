import { joinPath } from '../utils/path'

export const resolvePoiHostAssetPath = (...parts: string[]): string =>
  joinPath(window.ROOT, parts)

export const isPoiDarkTheme = (): boolean => Boolean(window.isDarkTheme)
