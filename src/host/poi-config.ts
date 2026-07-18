export const getConfig = <T = unknown>(path: string, defaultValue?: T): T =>
  config.get<T>(path, defaultValue)

export const setConfig = (path: string, value?: unknown): void => {
  config.set(path, value)
}
