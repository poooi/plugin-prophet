import type { Ship } from 'poi-lib-battle'

import { combinedFleetType, SortieState, type SortieStateValue } from '../utils/constants'
import {
  getTransportPointFromFleets,
  type TPResult,
} from '../utils/transport'

export interface BattleTitleInput {
  sortieState: SortieStateValue
  sortieMapId?: number
  currentNode?: number | string
  showEnemyTitle: boolean
  storedEnemyTitle?: string
  combinedFlag?: number
  fleetName?: string
  isBaseDefense?: boolean
}

export const battleSpotKey = (
  sortieState: SortieStateValue,
  sortieMapId?: number,
  currentNode?: number | string,
): string =>
  sortieState === SortieState.Practice ? 'practice' : `${sortieMapId}-${currentNode}`

export const enemyTitle = ({
  sortieState,
  showEnemyTitle,
  storedEnemyTitle,
}: Pick<BattleTitleInput, 'sortieState' | 'showEnemyTitle' | 'storedEnemyTitle'>): string => {
  const fallback = sortieState === SortieState.Practice ? 'PvP' : 'Enemy Vessel'
  return showEnemyTitle ? (storedEnemyTitle ?? fallback) : fallback
}

export const friendTitle = ({
  showEnemyTitle,
  combinedFlag = 0,
  fleetName = 'Sortie Fleet',
  isBaseDefense,
}: Pick<BattleTitleInput, 'showEnemyTitle' | 'combinedFlag' | 'fleetName' | 'isBaseDefense'>): string => {
  if (isBaseDefense) return 'Land Base'
  if (!showEnemyTitle) return 'Sortie Fleet'
  return combinedFlag > 0 ? (combinedFleetType[combinedFlag] ?? 'Combined Fleet') : fleetName
}

export const isTankTransportMap = (
  sortieMapId: number | undefined,
  tankTransportMaps: readonly number[],
): boolean => Number.isFinite(sortieMapId) && tankTransportMaps.includes(sortieMapId as number)

const noTP: TPResult = { total: 0, actual: 0 }

/**
 * Both flavours of TP, so the caller can show the pair while in port and the one
 * matching the map once sortied.
 */
export const transportPoints = ({
  inEvent,
  mainFleet = [],
  escortFleet = [],
  escapedShipIds = [],
}: {
  inEvent: boolean
  mainFleet?: (Ship | null)[]
  escortFleet?: (Ship | null)[]
  escapedShipIds?: number[]
}): { normal: TPResult; tank: TPResult } => {
  if (!inEvent) return { normal: noTP, tank: noTP }
  const fleets = [mainFleet, escortFleet]
  return {
    normal: getTransportPointFromFleets(fleets, { escapedShipIds }),
    tank: getTransportPointFromFleets(fleets, { escapedShipIds, mode: 'tank' }),
  }
}
