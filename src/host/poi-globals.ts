/**
 * Typed wrappers for Poi global variables.
 * Only this file may access window globals directly.
 * All other modules must import from here.
 */

export interface PoiConfig {
  get<T>(key: string, defaultVal: T): T
  set(key: string, val: unknown): void
}

declare global {
  interface Window {
    config: PoiConfig
    getStore: <T>(path: string, defaultVal?: T) => T
    dispatch: (action: unknown) => void
    notify: (message: string, opts?: NotifyOptions) => void
    ipc: PoiIpc
    dbg: PoiDbg
    APPDATA_PATH: string
    ROOT: string
    isSafeMode: boolean
    isDarkTheme: boolean
    $ships: Record<number, PoiShipConst> | undefined
    $slotitems: Record<number, PoiEquipConst> | undefined
    ResizeObserver: typeof ResizeObserver
  }

  // Poi globals available without window prefix
  var config: PoiConfig
}

export interface NotifyOptions {
  type?: string
  icon?: string
  audio?: string
}

export interface PoiIpc {
  access(name: string): Record<string, unknown>
}

export interface PoiDbg {
  isEnabled(): boolean
}

export interface PoiShipConst {
  api_id: number
  api_name: string
  api_yomi: string
  api_stype: number
  api_houg: number[]
  api_raig: number[]
  api_tyku: number[]
  api_souk: number[]
  api_fuel_max: number
  api_bull_max: number
  [key: string]: unknown
}

export interface PoiEquipConst {
  api_id: number
  api_name: string
  api_type: number[]
  [key: string]: unknown
}

export function getPoiConfig(): PoiConfig {
  return window.config
}

export function getStore<T>(path: string, defaultVal?: T): T {
  return window.getStore(path, defaultVal)
}

export function poiDispatch(action: unknown): void {
  window.dispatch(action)
}

export function poiNotify(message: string, opts?: NotifyOptions): void {
  window.notify(message, opts)
}

export function poiDbgEnabled(): boolean {
  return window.dbg.isEnabled()
}

export function getAppDataPath(): string {
  return window.APPDATA_PATH
}

export function getRootPath(): string {
  return window.ROOT
}

export function isSafeMode(): boolean {
  return window.isSafeMode
}

export function isDarkTheme(): boolean {
  return window.isDarkTheme
}

export function getShipConst(shipId: number): PoiShipConst | undefined {
  return window.$ships?.[shipId]
}

export function getEquipConst(equipId: number): PoiEquipConst | undefined {
  return window.$slotitems?.[equipId]
}

export function accessIpc(name: string): Record<string, unknown> {
  return window.ipc.access(name)
}
