export const resolvePluginPath = (...parts: string[]): string =>
  `/${parts.join('/')}`
