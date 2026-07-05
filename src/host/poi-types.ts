/**
 * Poi host Redux state type definitions.
 * These describe the shape of the Poi host Redux store.
 */

export interface SortieState {
  combinedFlag: number
  escapedPos: number[]
  sortieMapId: string
  currentNode: number
  sortieStatus: boolean[]
  item?: Record<string, number>
}

export interface FleetInfo {
  api_name: string
  api_ship: number[]
}

export interface AirbaseInfo {
  api_area_id: number
  api_rid: number
  api_name: string
  api_action_kind: number
  api_plane_info: AirbasePlaneInfo[]
  [key: string]: unknown
}

export interface AirbasePlaneInfo {
  api_slotid: number
  api_state: number
  api_count: number
  api_max_count: number
  [key: string]: unknown
}

export interface UseItemInfo {
  api_id: number
  api_count: number
  [key: string]: unknown
}

export interface PoiRootState {
  sortie: SortieState
  info: {
    fleets: Record<number, FleetInfo>
    airbase: AirbaseInfo[]
  }
  config: {
    plugin?: {
      prophet?: PluginConfig
    }
    poi?: {
      appearance?: {
        theme?: string
      }
    }
  }
  const: {
    $ships: Record<number, unknown>
    $equips: Record<number, unknown>
    $useitems: Record<number, unknown>
    $shipTypes: Record<number, { api_name: string }>
    $maps: Record<number, unknown>
  }
  ext: {
    [pluginKey: string]: {
      _?: {
        history?: Record<string, HistoryEntry>
        useitem?: Record<number, UseItemInfo>
      }
    }
  }
  fcd: {
    map: Record<string, MapData>
  }
  ipc: {
    NavyAlbum?: {
      showShip: boolean
    }
  }
}

export interface HistoryEntry {
  fFormation?: string
  title?: string
  smokeType?: number
}

export interface PluginConfig {
  layout?: 'auto' | 'horizontal' | 'vertical'
  showScale?: boolean
  ecGameOrder?: boolean
  showEnemyTitle?: boolean
  showLastFormation?: boolean
  useFinalParam?: boolean
  showAirRaid?: boolean
  showAvatar?: boolean
  'notify.enable'?: boolean
  'notify.damagedAudio'?: string
}

export interface MapSpot {
  [spotId: string]: [number, number]
}

export interface MapRoute {
  [nodeId: string]: [string, string]
}

export interface MapData {
  spots?: MapSpot
  route?: MapRoute
}
