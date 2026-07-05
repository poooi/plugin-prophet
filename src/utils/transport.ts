/**
 * Transport point calculation utilities.
 */

const TPByItem: Record<number, number> = {
  75: 5, // ドラム缶(輸送用)
  68: 8, // 大発動艇
  166: 8, // 大発動艇(八九式中戦車&陸戦隊)
  193: 8, // 特大発動艇
  230: 8, // 特大発動艇+戦車第11連隊
  355: 8, // M4A1 DD
  408: 8, // 装甲艇(AB艇)
  409: 8, // 武装大発
  436: 8, // 大発動艇(II号戦車/北アフリカ仕様)
  449: 8, // 特大発動艇+一式砲戦車
  482: 8, // 特大発動艇+Ⅲ号戦車(北アフリカ仕様)
  494: 8, // 特大発動艇+チハ
  495: 8, // 特大発動艇+チハ改
  514: 8, // 特大発動艇+Ⅲ号戦車J型
  167: 2, // 特二式内火艇
  145: 1, // 戦闘糧食
  150: 1, // 秋刀魚の缶詰
  241: 1, // 戦闘糧食(特別なおにぎり)
}

// note: light cruiser inherits 2 pts from type, making a total of 10 pts
const TPByShip: Record<number, number> = {
  487: 8, // 鬼怒改二
}

const TPByShipType: Record<number, number> = {
  2: 5, // 駆逐艦
  3: 2, // 軽巡洋艦
  21: 6, // 練習巡洋艦
  6: 4, // 航空巡洋艦
  10: 7, // 航空戦艦
  16: 9, // 水上機母艦
  14: 1, // 潜水空母
  17: 12, // 揚陸艦
  15: 15, // 補給艦
  22: 15, // 補給艦
  20: 7, // 潜水母艦
}

export interface TransportPoints {
  total: number
  actual: number
}

export interface ShipForTP {
  raw?: {
    api_stype?: number
    api_ship_id?: number
    api_id?: number
    api_nowhp?: number
    api_maxhp?: number
    poi_slot?: Array<{ api_slotitem_id?: number } | null> | null
    poi_slot_ex?: { api_slotitem_id?: number } | null
  }
  nowHP?: number
  maxHP?: number
}

export function getTPDazzyDing(ships: Array<ShipForTP | null | undefined>, escapedShipIds: number[] = []): TransportPoints {
  const validShips = ships.filter((s): s is ShipForTP => s != null && s.raw != null)

  const ignores = validShips.map((ship) => {
    const raw = ship.raw!
    return escapedShipIds.includes(raw.api_id ?? -1) || (raw.api_nowhp ?? 0) * 4 <= (raw.api_maxhp ?? 1)
  })

  const shipTPs = validShips.map((ship) => {
    const raw = ship.raw!
    return (TPByShipType[raw.api_stype ?? 0] ?? 0) + (TPByShip[raw.api_ship_id ?? 0] ?? 0)
  })

  const equipTPs = validShips.map((ship) => {
    const raw = ship.raw!
    const allSlots = [...(raw.poi_slot ?? []), raw.poi_slot_ex ?? null]
    return allSlots.reduce((sum, equip) => sum + (equip != null ? (TPByItem[equip.api_slotitem_id ?? 0] ?? 0) : 0), 0)
  })

  const shipTP = shipTPs.reduce((a, b) => a + b, 0)
  const equipTP = equipTPs.reduce((a, b) => a + b, 0)
  const shipActualTP = shipTPs.reduce((a, b, i) => a + (ignores[i] ? 0 : b), 0)
  const equipActualTP = equipTPs.reduce((a, b, i) => a + (ignores[i] ? 0 : b), 0)

  return {
    total: equipTP ? shipTP + equipTP : 0,
    actual: shipActualTP + equipActualTP,
  }
}
