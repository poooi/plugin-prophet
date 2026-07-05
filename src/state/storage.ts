/**
 * localStorage persistence for prophet plugin state.
 * Only this file may access localStorage directly.
 */

export const LS_PATH = '_prophet'

export interface ProphetCache {
  history?: Record<string, { fFormation?: string; title?: string; smokeType?: number }>
  useitem?: Record<number, { api_id: number; api_count: number }>
}

let _cache: ProphetCache = {}

export function loadCache(safeMode: boolean): ProphetCache {
  if (safeMode) {
    _cache = {}
    return _cache
  }
  try {
    const item = localStorage.getItem(LS_PATH)
    _cache = item ? (JSON.parse(item) as ProphetCache) : {}
  } catch {
    _cache = {}
  }
  return _cache
}

export function getCache(): ProphetCache {
  return _cache
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null

export function saveCache(): void {
  if (_saveTimer) clearTimeout(_saveTimer)
  _saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(LS_PATH, JSON.stringify(_cache))
    } catch {
      // ignore write errors
    }
    _saveTimer = null
  }, 5000)
}

export function setCachePath<K extends keyof ProphetCache>(key: K, val: ProphetCache[K]): void {
  _cache[key] = val
}
