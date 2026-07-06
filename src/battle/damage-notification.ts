import type { Ship } from 'poi-lib-battle'

import { SortieState, type SortieStateValue } from '../utils/constants'

export interface HeavyDamageShipNameInput {
  mainFleet?: (Ship | null)[]
  escortFleet?: (Ship | null)[]
  escapedPos?: number[]
  sortieState: SortieStateValue
  getShipName: (shipId: number | undefined) => string
  translate: (text: string) => string
}

const isHeavilyDamaged = (ship: Ship): boolean =>
  ship.maxHP > 0 && ship.nowHP / ship.maxHP <= 0.25

const shipApiId = (ship: Ship): number | undefined =>
  (ship.raw as { api_ship_id?: number } | undefined)?.api_ship_id

export const getHeavilyDamagedShipNames = ({
  mainFleet = [],
  escortFleet = [],
  escapedPos = [],
  sortieState,
  getShipName,
  translate,
}: HeavyDamageShipNameInput): string[] => {
  if (sortieState === SortieState.Practice) return []

  return [...mainFleet, ...escortFleet].flatMap((ship) => {
    if (!ship) return []
    if (!isHeavilyDamaged(ship)) return []
    if (escapedPos.includes(ship.pos - 1)) return []
    return [translate(getShipName(shipApiId(ship)))]
  })
}
