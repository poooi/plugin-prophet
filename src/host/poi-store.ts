export const getStore = <T = unknown>(path?: string, defaultValue?: T): T =>
  window.getStore(path, defaultValue)
