import path from 'path'

const { ROOT } = window

const PLUGIN_ROOT = path.resolve(__dirname, '../../')

export const resolvePluginPath = (...parts) =>
  path.resolve(PLUGIN_ROOT, ...parts)

export const resolveMainPath = (...parts) => path.resolve(ROOT, ...parts)
