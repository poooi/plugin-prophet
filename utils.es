import path from 'path'
import _ from 'lodash'
import i18next from 'views/env-parts/i18next'

import { Models } from './lib/battle'

const { APPDATA_PATH } = window
const { Ship, ShipOwner, Formation, Engagement, AirControl } = Models

export const PLUGIN_KEY = 'poi-plugin-prophet'
export const HISTORY_PATH = path.join(APPDATA_PATH, 'prophet-history.json')

const __ = i18next.getFixedT(null, [PLUGIN_KEY, 'resources'])

export function getItemName(item) {
  if (item == null) {
    return null
  }
  return __(item.api_name)
}

export const initEnemy = (
  intl = 0,
  api_ship_ke = [],
  api_eSlot,
  api_maxhps,
  api_nowhps,
  api_ship_lv,
) => {
  if (!(api_ship_ke != null)) return []
  const fleet = []
  _.range(api_ship_ke.length).forEach((i) => {
    const id = api_ship_ke[i]
    const slots = api_eSlot[i] || []
    let ship
    let raw
    if (Number.isInteger(id) && id > 0) {
      raw = {
        api_ship_id: id,
        api_lv: api_ship_lv[i],
        poi_slot: slots.map((slotId) =>
          window.getStore(`const.$equips.${slotId}`),
        ),
      }
      ship = new Ship({
        id,
        owner: ShipOwner.Enemy,
        pos: intl + i,
        maxHP: api_maxhps[i],
        nowHP: api_nowhps[i],
        items: [], // We dont care
        raw,
      })
    }
    fleet.push(ship)
  })
  return fleet
}

export const spotInfo = {
  0: '',
  1: 'Start',
  2: 'Battle Avoid',
  3: 'Obtain Resources',
  4: 'Lose Resources',
  5: 'Battle',
  6: 'Boss Battle',
  7: 'Battle Avoid',
  8: 'Air Strike',
  9: 'Escort Success',
  10: 'Transport Munitions',
  11: 'Long Distance Aerial Battle', // 長距離空襲戦
  12: 'Manual Selection',
  13: 'Aerial Recon',
  14: 'Night Battle',
  15: 'Enemy Combined Fleet',
  16: 'Anchorage Repair',
}

export const spotIcon = {
  Battle: '4-1',
  'Night Battle': '4-1',
  'Boss Battle': 5,
  'Obtain Resources': 2,
  'Battle Avoid': '4-2',
  'Long Distance Aerial Battle': 10,
  'Lose Resources': 3,
  'Manual Selection': '4-2',
  'Air Strike': 7,
  'Transport Munitions': 9,
  'Escort Success': 8,
  'Enemy Combined Fleet': '4-1',
  'Anchorage Repair': '4-2',
}

// give spot kind according to api_event_id and api_event_kind
// update according to https://github.com/andanteyk/ElectronicObserver/blob/1052a7b177a62a5838b23387ff35283618f688dd/ElectronicObserver/Other/Information/apilist.txt
export const getSpotKind = (api_event_id, api_event_kind) => {
  // console.log(`api_event_id = ${api_event_id}, api_event_kind = ${api_event_kind}`)
  if (api_event_id === 4) {
    // 4=通常戦闘
    if (api_event_kind === 2) return 14 // 2=夜戦
    if (api_event_kind === 4) return 8 // 4=航空戦
    if (api_event_kind === 5) return 15 // 5=敵連合艦隊戦
    if (api_event_kind === 6) return 11 // 6=長距離空襲戦
  }
  if (api_event_id === 6) {
    // 6=気のせいだった
    if (api_event_kind === 1) {
      // 1="敵影を見ず。"
      return 7
    }
    if (api_event_kind === 2) {
      // 2=能動分岐
      return 12
    }
  } else if (api_event_id === 7) {
    // 7=航空戦or航空偵察
    if (api_event_kind === 0) {
      // 4=航空戦
      return 13
    }
  } else if (api_event_id === 10 && api_event_kind === 0) {
    return 16 // 泊地修理
  }
  return api_event_id + 1
}

export const lostKind = {
  1: 'Resources sustained losses',
  2: 'Resources and land-based air squadrons sustained losses',
  3: 'Land-based air squadrons sustained losses',
  4: 'No damage was inflicted',
}

export const AttackType = {
  Normal: 'Normal', // 通常攻撃
  Laser: 'Laser', // レーザー攻撃
  Double: 'Double', // 連撃
  Primary_Secondary_CI: 'PSCI', // カットイン(主砲/副砲)
  Primary_Radar_CI: 'PRCI', // カットイン(主砲/電探)
  Primary_AP_CI: 'PACI', // カットイン(主砲/徹甲)
  Primary_Primary_CI: 'PrCI', // カットイン(主砲/主砲)
  Primary_Torpedo_CI: 'PTCI', // カットイン(主砲/魚雷)
  Torpedo_Torpedo_CI: 'TTCI', // カットイン(魚雷/魚雷)
}

export const getAttackTypeName = (type) => {
  switch (type) {
    case AttackType.Normal:
      return __('AT.Normal')
    case AttackType.Double:
      return __('AT.Double')
    case AttackType.Primary_Secondary_CI:
      return __('AT.Primary_Secondary_CI')
    case AttackType.Primary_Radar_CI:
      return __('AT.Primary_Radar_CI')
    case AttackType.Primary_AP_CI:
      return __('AT.Primary_AP_CI')
    case AttackType.Primary_Primary_CI:
      return __('AT.Primary_Primary_CI')
    case AttackType.Primary_Torpedo_CI:
      return __('AT.Primary_Torpedo_CI')
    case AttackType.Torpedo_Torpedo_CI:
      return __('AT.Torpedo_Torpedo_CI')
    default:
      return `${type}?`
  }
}

export const combinedFleetType = {
  0: 'Sortie Fleet',
  1: 'Carrier Task Force', // 空母機動部隊
  2: 'Surface Task Force', // 水上打撃部隊
  3: 'Transport Escort', // 輸送護衛部隊
}

// Formation name map from api_formation[0-1] to name
// 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
const FormationName = {
  [Formation.Ahead]: __('Line Ahead'),
  [Formation.Double]: __('Double Line'),
  [Formation.Diamond]: __('Diamond'),
  [Formation.Echelon]: __('Echelon'),
  [Formation.Abreast]: __('Line Abreast'),
  [Formation.Vanguard]: __('Vanguard'),
  [Formation.CruisingAntiSub]: __('Cruising Formation 1'),
  [Formation.CruisingForward]: __('Cruising Formation 2'),
  [Formation.CruisingDiamond]: __('Cruising Formation 3'),
  [Formation.CruisingBattle]: __('Cruising Formation 4'),
}

// Engagement name map from api_formation[2] to name
// 1=同航戦, 2=反航戦, 3=T字戦有利, 4=T字戦不利
const EngagementName = {
  [Engagement.Parallel]: __('Parallel Engagement'),
  [Engagement.Headon]: __('Head-on Engagement'),
  [Engagement.TAdvantage]: __('Crossing the T (Advantage)'),
  [Engagement.TDisadvantage]: __('Crossing the T (Disadvantage)'),
}

// Air Control name map from api_kouku.api_stage1.api_disp_seiku to name
// 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
const AirControlName = {
  [AirControl.Parity]: __('Air Parity'),
  [AirControl.Supremacy]: __('Air Supremacy'),
  [AirControl.Superiority]: __('Air Superiority'),
  [AirControl.Denial]: __('Air Denial'),
  [AirControl.Incapability]: __('Air Incapability'),
}

// build a translation object, to map lib battle string-parsed API to prophet's translation
// it requires that there's no duplicated keys
// if lib battle returns API number, then the translation should be done separately
const translation = {
  ...FormationName,
  ...EngagementName,
  ...AirControlName,
}

export const _t = (str) => translation[str] || str

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

// text extracted from SallyMain.swf scripts/scene/sally/phase/cellevents/MereFancyEventPhase
const spotMessage = {
  0: '気のせいだった。',
  1: '敵影を見ず。',
  3: '穏やかな海です。',
  4: '穏やかな海峡です。',
  5: '警戒が必要です。',
  6: '静かな海です。',
  7: '艦隊は対潜警戒進撃中。引き続き、対潜対空警戒を厳とせよ。',
  8: '敵哨戒機らしき機影認む。空襲の恐れあり。対空警戒を厳とせよ!',
  9: '1YB第一第二部隊栗田艦隊はパラワン水道を進撃中。現海域に敵影なし。警戒を厳とせよ!',
  10: '1YB第三部隊、西村艦隊は堂々と進撃中。遊撃部隊主力栗田艦隊を援護せよ! 進め!',
  11: '1YB第三部隊西村艦隊はこれよりスリガオ海峡方面に突入。主力栗田艦隊を援護する! 進め!',
  12: '艦隊はシブヤン海に突入する。対空見張り、厳とせよ！',
  13: '前線航空基地への航空資材輸送作戦は失敗せり。',
  14: '1YB第一第二部隊栗田艦隊はシブヤン海を進撃中。敵艦載機空襲が予測される。対空警戒を厳とせよ!',
  15: '1YB第一第二部隊栗田艦隊はサマール沖を進撃中。敵機動部隊を発見! 全艦突撃せよ!',
  16: '1YB第三部隊西村艦隊はスリガオ海峡に突入せり。栗田艦隊を援護する! 天祐を確認し、全艦突撃せよ!',
  17: 'KdMB機動部隊本隊小沢艦隊は敵機動部隊主力を北方に誘引、好機を捉えこれを捕捉撃破せよ！',
  18: '艦隊左舷にパナイ島を見ゆ……。対空警戒を厳とせよ！',
  19: '艦隊右舷にミンダナオ島を認む。入港準備…――始めッ！',
  20: '2YB遊撃第二部隊志摩艦隊、出撃！敵残存艦隊を索敵捕捉、掃射せよ！',
  21: '2YB遊撃第二部隊、敵哨戒機を発見す！敵機空襲が予測される。対空警戒、厳とせよ!',
  22: '2YB遊撃第二部隊、戦場海域に突入す！対空、そして対潜警戒も厳とせよ！',
  23: '1YB遊撃第一部隊より高速艦艇を抽出。敵残存艦隊の捜索撃滅に出撃す！',
  24: '連合艦隊機動部隊本隊、出撃！敵機動部隊を撃滅する！続け！',
  25: '艦隊、増速！これより連合艦隊は艦隊決戦を行う！　我に続け！',
}

export const getSpotMessage = (api_event_id, api_event_kind) => {
  if ([1, 6].includes(api_event_id)) {
    return spotMessage[api_event_kind] || ''
  }
  return ''
}

/**
 * determines layout by content width and height
 * @param width {number}
 * @param height {number}
 * @return 'horizontal' | 'vertical'
 */
export const getAutoLayout = (width, height) => {
  // vertical space limited, use horizontal layout
  if (height < 300) {
    return 'horizontal'
  }

  // suppose W:H = 5:3 is perfect ratio, it we have less height than the ratio, we'll use horizontal
  if (height * 5 < width * 3) {
    return 'horizontal'
  }

  return 'vertical'
}
