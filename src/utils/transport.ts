import _ from 'lodash'
import type { Ship } from 'poi-lib-battle'
import type { FriendShipRaw } from '../views/ship-view/types'

/**
 * Transport operations come in two flavours since 2026:
 *
 * - `normal`: the classic table, where every landing craft counts as 8.
 * - `tank`: "戦車輸送" maps (e.g. 2026 summer E-5-2), where an item is worth
 *   `normal * 0.75` plus a bonus depending on the tank it carries, and the ship type
 *   values are worth 0.75x as well.
 *
 * Checked against the in-game 艦隊戦力分析 panel and `api_landing_hp.api_sub_value`
 * for two real 2026 summer E-5 fleets: normal 205, tank 446 and 468.
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

/**
 * Base TP by equipment category (`api_type[2]`) instead of by item id, so a landing
 * craft we have never heard of still counts for the usual 8.
 */
const TPByItemType: Record<number, number> = {
  24: 8, // 上陸用舟艇 (大発動艇系)
  30: 5, // 簡易輸送部材 (ドラム缶)
  43: 1, // おにぎり (戦闘糧食系)
  46: 2, // 特型内火艇
}

/**
 * What the tank table adds on top of `base * TANK_RATIO`, by item id - the trailing
 * comment is the resulting S rank value. Items missing here keep the plain 0.75x base,
 * which is all a tankless landing craft, a drum or a ration is worth.
 */
const TankTPBonusByItem: Record<number, number> = {
  576: 18, // 大発動艇(R35&フランス兵) -> 24
  514: 17, // 特大発動艇+Ⅲ号戦車J型 -> 23
  449: 15, // 特大発動艇+一式砲戦車 -> 21
  355: 14, // M4A1 DD -> 20
  499: 14, // 陸軍歩兵部隊+チハ改 -> 14
  230: 13, // 特大発動艇+戦車第11連隊 -> 19
  495: 13, // 特大発動艇+チハ改 -> 19
  482: 13, // 特大発動艇+Ⅲ号戦車(北アフリカ仕様) -> 19
  526: 12, // 特四式内火艇改 -> 13.5
  494: 11, // 特大発動艇+チハ -> 17
  167: 11, // 特二式内火艇 -> 12.5
  436: 10, // 大発動艇(II号戦車/北アフリカ仕様) -> 16
  525: 10, // 特四式内火艇 -> 11.5
  498: 9, // 九七式中戦車 新砲塔(チハ改) -> 9
  166: 8, // 大発動艇(八九式中戦車&陸戦隊) -> 14
  497: 7, // 九七式中戦車(チハ) -> 7
  496: 5, // 陸軍歩兵部隊 -> 5
}

const TANK_RATIO = 0.75

/**
 * 鬼怒改二 delivers one 大発 worth of TP on top of its ship type value, once per fleet.
 * The tank table does not scale this one down: it stays 8 there too.
 */
const TPBonusByShip: Record<number, number> = {
  487: 8, // 鬼怒改二
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

type ItemLike = { api_slotitem_id?: number; api_type?: number[] } | null | undefined

const itemTP = (item: ItemLike, mode: TransportMode): number => {
  if (item == null) return 0
  const base = TPByItemType[item.api_type?.[2] ?? -1] ?? 0
  if (mode !== 'tank') return base
  return base * TANK_RATIO + (TankTPBonusByItem[item.api_slotitem_id ?? -1] ?? 0)
}

const shipTypeTP = (stype: number, mode: TransportMode): number =>
  (TPByShipType[stype] || 0) * (mode === 'tank' ? TANK_RATIO : 1)

// ship bonuses count once per fleet, however many such ships are in it
const shipBonuses = (shipIds: number[]): number[] => {
  const counted = new Set<number>()
  return shipIds.map((shipId) => {
    const bonus = TPBonusByShip[shipId] || 0
    if (!bonus || counted.has(shipId)) return 0
    counted.add(shipId)
    return bonus
  })
}

export interface TPResult {
  total: number
  actual: number
}

interface ShipTP {
  ignored: boolean
  ship: number
  bonus: number
  equip: number
}

// tank values are fractional, the fleet total is floored
const collect = (ships: ShipTP[]): TPResult => {
  const shipTP = ({ ship, bonus, equip }: ShipTP): number => ship + bonus + equip
  const equipTP = _.sumBy(ships, 'equip')

  return {
    total: equipTP ? Math.floor(_.sumBy(ships, shipTP)) : 0,
    actual: Math.floor(_.sumBy(ships.filter(({ ignored }) => !ignored), shipTP)),
  }
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
  mode: TransportMode = 'normal',
): TPResult => {
  const bonuses = shipBonuses(_.map(shipsData, 'api_ship_id'))

  return collect(
    _.map(shipsData, (ship, index) => ({
      ignored: escapedShipIds.includes(ship.api_id) || ship.api_nowhp * 4 <= ship.api_maxhp,
      ship: shipTypeTP(ship.api_stype, mode),
      bonus: bonuses[index],
      equip: _.sumBy(equipsData[index] ?? [], (slot) => itemTP((slot ?? [])[0], mode)),
    })),
  )
}

export const getTPDazzyDing = (
  ships: (Ship | null | undefined)[],
  escapedShipIds: number[] = [],
  mode: TransportMode = 'normal',
): TPResult => {
  const raws = ships
    .filter((ship): ship is Ship => ship != null)
    .map((ship) => ship.raw as FriendShipRaw)
  const bonuses = shipBonuses(raws.map((raw) => raw.api_ship_id ?? -1))

  return collect(
    raws.map((raw, index) => ({
      ignored:
        escapedShipIds.includes(raw.api_id ?? -1) ||
        (raw.api_nowhp ?? 0) * 4 <= (raw.api_maxhp ?? 0),
      ship: shipTypeTP(raw.api_stype, mode),
      bonus: bonuses[index],
      equip: _.sumBy([...(raw.poi_slot ?? []), raw.poi_slot_ex ?? null], (item) =>
        itemTP(item, mode),
      ),
    })),
  )
}
