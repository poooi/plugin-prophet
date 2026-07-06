import type { Ship } from 'poi-lib-battle'

import { combinedFleetType, SortieState, type SortieStateValue } from '../utils/constants'
import { getTPDazzyDing } from '../utils/transport'

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
}): { total: number; actual: number } =>
  inEvent
    ? getTPDazzyDing([...mainFleet, ...escortFleet, ...escapedShipIds.map(() => null)], escapedShipIds)
    : { total: 0, actual: 0 }
