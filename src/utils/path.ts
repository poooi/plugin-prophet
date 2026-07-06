import path from 'path'

const PLUGIN_ROOT = __dirname

export const resolvePluginPath = (...parts: string[]): string =>
  path.resolve(PLUGIN_ROOT, ...parts)
