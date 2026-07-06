import type { APIMstShip, APIMstSlotitem, APIMstUseitem, APIMstStype } from 'kcsapi/api_start2/getData/response'
import type { APIGetMemberSlotItemResponse } from 'kcsapi/api_get_member/slot_item/response'
import type { APIAirBase } from 'kcsapi/api_get_member/mapinfo/response'
import type { APIUseitem } from 'kcsapi/api_get_member/require_info/response'

export {}

declare global {
  // PoiRootState is narrowed for this plugin and should be kept in sync with
  // poooi/poi views/redux/** and views/create-store.ts as fields are touched.
  interface ObjectConstructor {
    clone: <T>(obj: T) => T
  }

  type ApiSlotItemLike = APIGetMemberSlotItemResponse & Pick<APIMstSlotitem, 'api_name' | 'api_type'>

  interface PoiRootState {
    sortie: {
      sortieStatus?: boolean[]
      combinedFlag?: number
      escapedPos?: number[]
      sortieMapId?: number
      currentNode?: number | string
      item?: Record<string, number>
    }
    info: {
      airbase?: APIAirBase[]
      // Mirrored from poooi/poi views/redux/info/useitems.ts UseItemsState.
      useitems?: Record<string, APIUseitem>
      fleets?: Record<number, {
        api_ship: number[]
        api_name: string
      }>
    }
    const: {
      $maps?: Record<string, unknown>
      $ships?: Record<number, APIMstShip>
      $equips?: Record<number, APIMstSlotitem>
      $useitems?: Record<number, APIMstUseitem>
      $shipTypes?: Record<number, APIMstStype>
    }
    config: {
      poi?: {
        appearance?: {
          theme?: string
        }
      }
      plugin?: {
        prophet?: {
          layout?: string
          showAirRaid?: boolean
          showScale?: boolean
          showEnemyTitle?: boolean
          ecGameOrder?: boolean
          useFinalParam?: boolean
          showAvatar?: boolean
          showLastFormation?: boolean
          notify?: {
            enable?: boolean
            damagedAudio?: string
          }
        }
      }
    }
    fcd?: {
      map?: Record<string, {
        spots?: Record<string, number[]>
        route?: Record<string, number[]>
      }>
    }
    ipc?: {
      NavyAlbum?: {
        showShip: boolean
      }
    }
    ext?: Record<string, {
      _?: Record<string, Record<string, unknown>>
    }>
  }

  interface IConfig {
    get: <T = unknown>(path: string, defaultValue?: T) => T
    set: (path: string, value?: unknown) => void
  }

  const config: IConfig

  interface IDbg {
    isEnabled: () => boolean
  }

  interface INotifyOptions {
    type?: string
    icon?: string
    audio?: string
  }

  namespace NodeJS {
    interface Global {
      config: IConfig
    }
  }

  interface Window {
    ROOT: string
    APPDATA_PATH: string
    config: IConfig
    language: string
    getStore: <T = unknown>(path?: string, defaultValue?: T) => T
    dispatch: (action: { type: string; [key: string]: unknown }) => unknown
    isMain: boolean
    isSafeMode?: boolean
    isDarkTheme?: boolean
    notify: (message: string, options?: INotifyOptions) => void
    dbg: IDbg
    ResizeObserver: typeof ResizeObserver
    prophetTest?: (battle: import('poi-lib-battle').Battle) => void
    baseDefenseTest?: (eventDetail: { path: string; body: Record<string, unknown> }) => void
    ipc?: {
      access: (name: string) => Record<string, (...args: unknown[]) => unknown>
    }
  }
}
