export const resolvePoiHostAssetPath = (...parts: string[]): string =>
  `/poi/${parts.join('/')}`

export const isPoiDarkTheme = (): boolean => false
