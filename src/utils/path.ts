const PLUGIN_ROOT = __dirname

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

export const resolvePluginPath = (...parts: string[]): string =>
  joinPath(PLUGIN_ROOT, parts)
