import _ from 'lodash'
import type { Ship } from 'poi-lib-battle'
import type { FriendShipRaw } from '../views/ship-view/types'

const TPByItem: Record<number, number> = {
  75: 5,
  68: 8,
  166: 8,
  193: 8,
  230: 8,
  355: 8,
  408: 8,
  409: 8,
  436: 8,
  449: 8,
  482: 8,
  494: 8,
  495: 8,
  514: 8,
  167: 2,
  145: 1,
  150: 1,
  241: 1,
}

const TPByShip: Record<number, number> = {
  487: 8,
}

const TPByShipType: Record<number, number> = {
  2: 5,
  3: 2,
  21: 6,
  6: 4,
  10: 7,
  16: 9,
  14: 1,
  17: 12,
  15: 15,
  22: 15,
  20: 7,
}

export interface TPResult {
  total: number
  actual: number
}

interface TransportShipData {
  api_id: number
  api_nowhp: number
  api_maxhp: number
  api_stype: number
  api_ship_id: number
}

type EquipSlotTuple = [ApiSlotItemLike | null | undefined, ...unknown[]]

export const getTransportPoint = (
  shipsData: TransportShipData[],
  equipsData: (EquipSlotTuple | null | undefined)[][],
  escapedShipIds: number[] = [],
): TPResult => {
  const ignores = _.map(
    shipsData,
    (ship) =>
      escapedShipIds.includes(ship.api_id) || ship.api_nowhp * 4 <= ship.api_maxhp,
  )

  const shipTPs = _.map(
    shipsData,
    (ship) => (TPByShipType[ship.api_stype] || 0) + (TPByShip[ship.api_ship_id] || 0),
  )

  const equipTPs = _.map(equipsData, (equipData) =>
    _.sum(_.map(equipData, (slot) => {
      const equip = (slot ?? [])[0]
      return (equip ? TPByItem[equip.api_slotitem_id] : 0) || 0
    })),
  )

  const shipTP = _.sum(shipTPs)
  const equipTP = _.sum(equipTPs)

  const shipActualTP = _.sum(_.map(ignores, (ignore, index) => (ignore ? 0 : shipTPs[index])))
  const equipActualTP = _.sum(_.map(ignores, (ignore, index) => (ignore ? 0 : equipTPs[index])))

  return {
    total: equipTP ? shipTP + equipTP : 0,
    actual: shipActualTP + equipActualTP,
  }
}

export const getTPDazzyDing = (ships: (Ship | null | undefined)[], escapedShipIds: number[] = []): TPResult => {
  const validShips = ships.filter((s): s is Ship => s != null)

  const ignores = validShips.map((ship) => {
    const raw = ship.raw as FriendShipRaw
    return escapedShipIds.includes(raw.api_id ?? -1) || (raw.api_nowhp ?? 0) * 4 <= (raw.api_maxhp ?? 0)
  })

  const shipTPs = validShips.map((ship) => {
    const raw = ship.raw as FriendShipRaw
    return (TPByShipType[raw.api_stype] || 0) + (TPByShip[raw.api_ship_id ?? -1] || 0)
  })

  const equipTPs = validShips.map((ship) => {
    const raw = ship.raw as FriendShipRaw
    const allEquips = [...(raw.poi_slot ?? []), raw.poi_slot_ex ?? null]
    return _.sum(
      _.map(allEquips, (equip) => (equip ? TPByItem[equip.api_slotitem_id] : 0) || 0),
    )
  })

  const shipTP = _.sum(shipTPs)
  const equipTP = _.sum(equipTPs)

  const shipActualTP = _.sum(_.map(ignores, (ignore, index) => (ignore ? 0 : shipTPs[index])))
  const equipActualTP = _.sum(_.map(ignores, (ignore, index) => (ignore ? 0 : equipTPs[index])))

  return {
    total: equipTP ? shipTP + equipTP : 0,
    actual: shipActualTP + equipActualTP,
  }
}
