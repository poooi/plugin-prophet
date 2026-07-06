const joinPath = (root: string, parts: string[]): string =>
  [
    root.replace(/\\/g, '/').replace(/\/+$/, ''),
    ...parts.map((part) =>
      part
        .replace(/\\/g, '/')
        .replace(/^\.\//, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, ''),
    ),
  ].filter(Boolean).join('/')

export const resolvePoiHostAssetPath = (...parts: string[]): string =>
  joinPath(window.ROOT, parts)

export const isPoiDarkTheme = (): boolean => Boolean(window.isDarkTheme)
