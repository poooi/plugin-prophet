import _ from 'lodash'

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
 * What the tank table adds on top of `base * 0.75`, by item id - the trailing
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

interface TransportRule {
  baseMultiplier: { numerator: number; denominator: number }
  itemBonusById: Readonly<Record<number, number>>
}

const rules: Record<TransportMode, TransportRule> = {
  normal: {
    baseMultiplier: { numerator: 1, denominator: 1 },
    itemBonusById: {},
  },
  tank: {
    baseMultiplier: { numerator: 3, denominator: 4 },
    itemBonusById: TankTPBonusByItem,
  },
}

const KINU_KAI_NI = 487
const KINU_BONUS = 8

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

export interface TransportItem {
  itemId: number
  category: number
}

export interface TransportShip {
  /** Master ship ID, used for ship-specific bonuses. */
  shipId: number
  shipType: number
  eligible: boolean
  items: readonly TransportItem[]
}

export interface TransportResult {
  planned: number
  deliverable: number
  /** Cargo presence is separate from the ship's own transport capacity. */
  hasTransportCargo: boolean
}

type TransportFleets = readonly (readonly TransportShip[])[]

const score = (fleets: TransportFleets, rule: TransportRule): number => {
  const { numerator, denominator } = rule.baseMultiplier
  const fleetPoints = _.sumBy(fleets, (ships) => {
    const items = ships.flatMap((ship) => ship.items)
    const base = _.sumBy(ships, (ship) => TPByShipType[ship.shipType] ?? 0) +
      _.sumBy(items, (item) => TPByItemType[item.category] ?? 0)
    const itemBonus = _.sumBy(items, (item) => rule.itemBonusById[item.itemId] ?? 0)

    // Preserve per-fleet rounding; do not round individual contributions.
    return Math.floor((base * numerator + itemBonus * denominator) / denominator)
  })

  // Once across main + escort, evaluated on the population being scored.
  // This integer bonus stays unscaled in the current tank rule, so adding it
  // after per-fleet rounding is equivalent to including it before rounding.
  const fleetBonus = fleets.some((ships) =>
    ships.some((ship) => ship.shipId === KINU_KAI_NI),
  ) ? KINU_BONUS : 0

  return fleetPoints + fleetBonus
}

/**
 * S-rank TP from normalized ships. Keep main and escort as separate fleets.
 * Eligibility is supplied by the caller; this calculation does not interpret HP.
 */
export const calculateTransport = (
  fleets: TransportFleets,
  mode: TransportMode = 'normal',
): TransportResult => {
  const rule = rules[mode]
  return {
    planned: score(fleets, rule),
    deliverable: score(fleets.map((ships) => ships.filter((ship) => ship.eligible)), rule),
    hasTransportCargo: fleets.some((ships) => ships.some((ship) =>
      ship.items.some((item) =>
        (TPByItemType[item.category] ?? 0) > 0 || (rule.itemBonusById[item.itemId] ?? 0) > 0,
      ),
    )),
  }
}
