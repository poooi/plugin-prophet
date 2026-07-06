const joinPath = (root: string, parts: string[]): string =>
  [root, ...parts].join('/').replace(/\/+/g, '/')

export const resolvePoiHostAssetPath = (...parts: string[]): string =>
  joinPath(window.ROOT, parts)

export const isPoiDarkTheme = (): boolean => Boolean(window.isDarkTheme)
