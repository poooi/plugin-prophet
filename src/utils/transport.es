import _ from 'lodash'

const TPByItem = {
  75: 5, // ドラム缶(輸送用)
  68: 8, // 大発動艇
  166: 8, // 大発動艇(八九式中戦車&陸戦隊)
  193: 8, // 特大発動艇
  230: 8, // 特大発動艇+戦車第11連隊
  167: 2, // 特二式内火艇
  145: 1, // 戦闘糧食
  150: 1, // 秋刀魚の缶詰
  241: 1, // 戦闘糧食(特別なおにぎり)
}

// note that as light cruiser she inherits 2 pts, making a total of 10 pts
const TPByShip = {
  487: 8, // 鬼怒改二
}

const TPByShipType = {
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

// ships: [ship for ship in fleet]
// equips: [[equip for equip on ship] for ship in fleet]
export const getTransportPoint = (
  shipsData,
  equipsData,
  escapedShipIds = [],
) => {
  const ignores = _.map(
    shipsData,
    (ship) =>
      escapedShipIds.includes(ship.api_id) ||
      ship.api_nowhp * 4 <= ship.api_maxhp,
  )

  const shipTPs = _.map(
    shipsData,
    (ship) =>
      (TPByShipType[ship.api_stype] || 0) + (TPByShip[ship.api_ship_id] || 0),
  )

  const equipTPs = _.map(equipsData, (equipData) =>
    _.sum(
      _.map(equipData, ([equip] = []) => TPByItem[equip.api_slotitem_id] || 0),
    ),
  )

  const shipTP = _.sum(shipTPs)
  const equipTP = _.sum(equipTPs)

  const shipActualTP = _.sum(
    _.map(ignores, (ignore, index) => (ignore ? 0 : shipTPs[index])),
  )
  const equipActualTP = _.sum(
    _.map(ignores, (ignore, index) => (ignore ? 0 : equipTPs[index])),
  )

  return {
    total: equipTP ? shipTP + equipTP : 0,
    actual: shipActualTP + equipActualTP,
  }
}

// ships: [ship (dazzy ding format) for ship in fleet]
export const getTPDazzyDing = (ships, escapedShipIds = []) => {
  const ignores = _(ships)
    .filter(Boolean)
    .map(
      ({ raw = {} } = {}) =>
        escapedShipIds.includes(raw.api_id) ||
        raw.api_nowhp * 4 <= raw.api_maxhp,
    )
    .value()

  const shipTPs = _(ships)
    .filter(Boolean)
    .map(
      ({ raw = {} } = {}) =>
        (TPByShipType[raw.api_stype] || 0) + (TPByShip[raw.api_ship_id] || 0),
    )
    .value()

  const equipTPs = _(ships)
    .filter(Boolean)
    .flatMap(({ raw: { poi_slot = [], poi_slot_ex } = {} } = {}) =>
      _.sum(
        _.map(
          poi_slot.concat(poi_slot_ex),
          (equip) => TPByItem[(equip || {}).api_slotitem_id] || 0,
        ),
      ),
    )
    .value()

  const shipTP = _.sum(shipTPs)
  const equipTP = _.sum(equipTPs)

  const shipActualTP = _.sum(
    _.map(ignores, (ignore, index) => (ignore ? 0 : shipTPs[index])),
  )
  const equipActualTP = _.sum(
    _.map(ignores, (ignore, index) => (ignore ? 0 : equipTPs[index])),
  )

  return {
    total: equipTP ? shipTP + equipTP : 0,
    actual: shipActualTP + equipActualTP,
  }
}
