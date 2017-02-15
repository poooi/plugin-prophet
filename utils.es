const { i18n } = window
import _ from 'lodash'
import { Models } from './lib/battle'
const { Ship, ShipOwner, Formation, Engagement, AirControl } = Models

const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

export const PLUGIN_KEY = 'poi-plugin-prophet'

export function getShipName(ship) {
  if (ship == null) {
    return null
  }
  let name = i18n.resources.__(ship.api_name)
  let yomi = ship.api_yomi
  if (['elite', 'flagship'].includes(yomi)) {
    name += yomi
  }
  console.log(name)
  return name
}

export function getItemName(item) {
  if (item == null) {
    return null
  }
  return i18n.resources.__(item.api_name)
}

export async function sleep(ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms > 0 ? ms : 0)
  })
}

export const initEnemy = (intl=0, api_ship_ke, api_eSlot, api_maxhps, api_nowhps, api_ship_lv) => {
  if (!(api_ship_ke != null)) return
  let fleet = []
  for (const i of _.range(1, 7)) {
    let id    = api_ship_ke[i]
    let slots = api_eSlot[i - 1] || []
    let ship, raw
    if (Number.isInteger(id) && id > 0) {
      raw = {
        api_ship_id: id,
        api_lv: api_ship_lv[i],
        poi_slot: slots.map(id => window.getStore(`const.$equips.${id}`)),
      }
      ship = new Ship({
        id   : id,
        owner: ShipOwner.Enemy,
        pos  : intl + i,
        maxHP: api_maxhps[i + 6],
        nowHP: api_nowhps[i + 6],
        items: [],  // We dont care
        raw  : raw,
      })
    }
    fleet.push(ship)
  }
  return fleet
}

export const spotInfo = {
  '0': '',
  '1': 'Start',
  '2': 'Unknown',
  '3': 'Obtain Resources',
  '4': 'Lose Resources',
  '5': 'Battle',
  '6': 'Boss Battle',
  '7': 'Battle Avoid',
  '8': 'Air Strike',
  '9': 'Escort Success',
  '10': 'Transport Munitions',
  '11': 'Long Distance Aerial Battle', //長距離空襲戦
  '12': 'Manual Selection',
  '13': 'Aerial Recon',
  '14': 'Night Battle',
  '15': 'Enemy Combined Fleet',
}


// give spot kind according to api_event_id and api_event_kind
// update according to https://github.com/andanteyk/ElectronicObserver/blob/1052a7b177a62a5838b23387ff35283618f688dd/ElectronicObserver/Other/Information/apilist.txt
export const getSpotKind = (api_event_id, api_event_kind) => {
  // console.log(`api_event_id = ${api_event_id}, api_event_kind = ${api_event_kind}`)
  if (api_event_id == 4){ //4=通常戦闘
    if (api_event_kind == 2) return 14 //2=夜戦
    if (api_event_kind == 4) return 8 //4=航空戦
    if (api_event_kind == 5) return 15 //5=敵連合艦隊戦
    if (api_event_kind == 6) return 11 //6=長距離空襲戦
  }
  if (api_event_id === 6) { //6=気のせいだった
    if (api_event_kind === 1) { //1="敵影を見ず。"
      return 7
    } else if (api_event_kind === 2) { // 2=能動分岐
      return 12
    }
  } else if (api_event_id === 7) { //7=航空戦or航空偵察
    if (api_event_kind === 0) { //4=航空戦
      return 13
    }
  }
  return api_event_id + 1
}

export const lostKind = {
  '1': 'Resources sustained losses',
  '2': 'Resources and land-based air squadrons sustained losses',
  '3': 'Land-based air squadrons sustained losses',
  '4': 'No damage was inflicted',
}

export const AttackType = {
  Normal: "Normal",             // 通常攻撃
  Laser : "Laser",              // レーザー攻撃
  Double: "Double",             // 連撃
  Primary_Secondary_CI: "PSCI", // カットイン(主砲/副砲)
  Primary_Radar_CI    : "PRCI", // カットイン(主砲/電探)
  Primary_AP_CI       : "PACI", // カットイン(主砲/徹甲)
  Primary_Primary_CI  : "PrCI", // カットイン(主砲/主砲)
  Primary_Torpedo_CI  : "PTCI", // カットイン(主砲/魚雷)
  Torpedo_Torpedo_CI  : "TTCI", // カットイン(魚雷/魚雷)
}


export const getAttackTypeName = (type) => {
  switch (type) {
  case AttackType.Normal:
    return __("AT.Normal")
  case AttackType.Double:
    return __("AT.Double")
  case AttackType.Primary_Secondary_CI:
    return __("AT.Primary_Secondary_CI")
  case AttackType.Primary_Radar_CI:
    return __("AT.Primary_Radar_CI")
  case AttackType.Primary_AP_CI:
    return __("AT.Primary_AP_CI")
  case AttackType.Primary_Primary_CI:
    return __("AT.Primary_Primary_CI")
  case AttackType.Primary_Torpedo_CI:
    return __("AT.Primary_Torpedo_CI")
  case AttackType.Torpedo_Torpedo_CI:
    return __("AT.Torpedo_Torpedo_CI")
  default:
    return type + "?"
  }
}


// Formation name map from api_formation[0-1] to name
// 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
const FormationName = {
  [Formation.Ahead  ]: __('Line Ahead'),
  [Formation.Double ]: __('Double Line'),
  [Formation.Diamond]: __('Diamond'),
  [Formation.Echelon]: __('Echelon'),
  [Formation.Abreast]: __('Line Abreast'),
  [Formation.CruisingAntiSub]: __('Cruising Formation 1'),
  [Formation.CruisingForward]: __('Cruising Formation 2'),
  [Formation.CruisingDiamond]: __('Cruising Formation 3'),
  [Formation.CruisingBattle ]: __('Cruising Formation 4'),
}

// Engagement name map from api_formation[2] to name
// 1=同航戦, 2=反航戦, 3=T字戦有利, 4=T字戦不利
const EngagementName = {
  [Engagement.Parallel     ]: __('Parallel Engagement'),
  [Engagement.Headon       ]: __('Head-on Engagement'),
  [Engagement.TAdvantage   ]: __('Crossing the T (Advantage)'),
  [Engagement.TDisadvantage]: __('Crossing the T (Disadvantage)'),
}

// Air Control name map from api_kouku.api_stage1.api_disp_seiku to name
// 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
const AirControlName = {
  [AirControl.Parity      ]: __('Air Parity'),
  [AirControl.Supremacy   ]: __('Air Supremacy'),
  [AirControl.Superiority ]: __('Air Superiority'),
  [AirControl.Denial      ]: __('Air Denial'),
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
