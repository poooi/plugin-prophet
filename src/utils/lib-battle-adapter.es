import _ from 'lodash'
import i18next from 'views/env-parts/i18next'

import { Models } from '../../lib/battle'
import { PLUGIN_KEY } from './constants'

const __ = i18next.getFixedT(null, [PLUGIN_KEY, 'resources'])

const { Ship, ShipOwner, Formation, Engagement, AirControl } = Models

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
