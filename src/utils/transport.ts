import _ from 'lodash'
import type { Ship } from 'poi-lib-battle'
import type { FriendShipRaw } from '../views/ship-view/types'

/**
 * Transport operations come in two flavours since 2026:
 *
 * - `normal`: the classic TP table, every landing craft counts as 8.
 * - `tank`: "戦車輸送" maps (e.g. 2026 summer E-5-2), where landing craft carrying
 *   tanks and 内火艇 are worth far more, while everything else (plain landing craft,
 *   drums, rations and the ship type values themselves) is worth 0.75x its normal value.
 *
 * Verified against 2026 summer E-5 with a 12 ship fleet: normal 205, tank 446.
 */
export type TransportMode = 'normal' | 'tank'

/**
 * Which maps use the tank table is not something we get to decide: the game reads it
 * from `api_get_member/chart_additional_info`, whose `api_atp_value` ("alternative TP")
 * holds a TP override keyed by map id for every such map. The client picks
 * `atp_value[mapId] ?? tp_value`, and tests for such a map with a plain truthy check
 * on `atp_value[mapId]` - so the keys with a truthy value are the tank transport maps.
 */
export interface ChartAdditionalInfoLike {
  api_deck_param?: {
    api_seiku_value?: number
    api_tp_value?: number
    api_atp_value?: Record<string, unknown>
  }[]
}

export const parseTankTransportMaps = (body: ChartAdditionalInfoLike): number[] =>
  _(body.api_deck_param ?? [])
    .flatMap((deck) => Object.entries(deck.api_atp_value ?? {}))
    .filter(([, value]) => Boolean(value))
    .map(([mapId]) => Number(mapId))
    .filter((mapId) => Number.isFinite(mapId))
    .uniq()
    .sortBy()
    .value()

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
  576: 8,
  167: 2,
  525: 2,
  526: 2,
  145: 1,
  150: 1,
  241: 1,
}

/**
 * Tank transport values, only for the items that break the flat 0.75x rule.
 * Anything missing here falls back to `TPByItem * TANK_RATIO`.
 */
const TPByItemTank: Record<number, number> = {
  576: 24, // 大発動艇(R35&フランス兵)
  514: 23, // 特大発動艇+Ⅲ号戦車J型
  449: 21, // 特大発動艇+一式砲戦車
  355: 20, // M4A1 DD
  230: 19, // 特大発動艇+戦車第11連隊
  482: 19, // 特大発動艇+Ⅲ号戦車(北アフリカ仕様)
  495: 19, // 特大発動艇+チハ改
  494: 17, // 特大発動艇+チハ
  436: 16, // 大発動艇(II号戦車/北アフリカ仕様)
  166: 14, // 大発動艇(八九式中戦車&陸戦隊)
  499: 14, // 陸軍歩兵部隊+チハ改
  526: 13.5, // 特四式内火艇改
  525: 12.5, // 特四式内火艇
  167: 12.5, // 特二式内火艇
  498: 9, // 九七式中戦車 新砲塔(チハ改)
  497: 7, // 九七式中戦車(チハ)
}

const TANK_RATIO = 0.75

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

const itemTP = (slotitemId: number | undefined, mode: TransportMode): number => {
  if (slotitemId == null) return 0
  const normal = TPByItem[slotitemId] || 0
  if (mode !== 'tank') return normal
  return TPByItemTank[slotitemId] ?? normal * TANK_RATIO
}

const shipTP = (stype: number, shipId: number, mode: TransportMode): number => {
  const normal = (TPByShipType[stype] || 0) + (TPByShip[shipId] || 0)
  return mode === 'tank' ? normal * TANK_RATIO : normal
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

// tank transport values are fractional, the game floors the fleet total
const sumTP = (values: number[]): number => Math.floor(_.sum(values))

export const getTransportPoint = (
  shipsData: TransportShipData[],
  equipsData: (EquipSlotTuple | null | undefined)[][],
  escapedShipIds: number[] = [],
  mode: TransportMode = 'normal',
): TPResult => {
  const ignores = _.map(
    shipsData,
    (ship) =>
      escapedShipIds.includes(ship.api_id) || ship.api_nowhp * 4 <= ship.api_maxhp,
  )

  const shipTPs = _.map(shipsData, (ship) => shipTP(ship.api_stype, ship.api_ship_id, mode))

  const equipTPs = _.map(equipsData, (equipData) =>
    _.sum(_.map(equipData, (slot) => itemTP((slot ?? [])[0]?.api_slotitem_id, mode))),
  )

  const equipTP = _.sum(equipTPs)

  const actual = sumTP(
    _.map(ignores, (ignore, index) => (ignore ? 0 : shipTPs[index] + equipTPs[index])),
  )

  return {
    total: equipTP ? sumTP([_.sum(shipTPs), equipTP]) : 0,
    actual,
  }
}

export const getTPDazzyDing = (
  ships: (Ship | null | undefined)[],
  escapedShipIds: number[] = [],
  mode: TransportMode = 'normal',
): TPResult => {
  const validShips = ships.filter((s): s is Ship => s != null)

  const ignores = validShips.map((ship) => {
    const raw = ship.raw as FriendShipRaw
    return escapedShipIds.includes(raw.api_id ?? -1) || (raw.api_nowhp ?? 0) * 4 <= (raw.api_maxhp ?? 0)
  })

  const shipTPs = validShips.map((ship) => {
    const raw = ship.raw as FriendShipRaw
    return shipTP(raw.api_stype, raw.api_ship_id ?? -1, mode)
  })

  const equipTPs = validShips.map((ship) => {
    const raw = ship.raw as FriendShipRaw
    const allEquips = [...(raw.poi_slot ?? []), raw.poi_slot_ex ?? null]
    return _.sum(_.map(allEquips, (equip) => itemTP(equip?.api_slotitem_id, mode)))
  })

  const equipTP = _.sum(equipTPs)

  const actual = sumTP(
    _.map(ignores, (ignore, index) => (ignore ? 0 : shipTPs[index] + equipTPs[index])),
  )

  return {
    total: equipTP ? sumTP([_.sum(shipTPs), equipTP]) : 0,
    actual,
  }
}
