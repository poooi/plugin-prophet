const PLUGIN_ROOT = __dirname

const joinPath = (root: string, parts: string[]): string =>
  [root, ...parts].join('/').replace(/\/+/g, '/')

export const resolvePluginPath = (...parts: string[]): string =>
  joinPath(PLUGIN_ROOT, parts)
