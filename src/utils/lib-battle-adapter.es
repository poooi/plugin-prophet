import _ from 'lodash'
import i18next from 'views/env-parts/i18next'

import { Models } from '../../lib/battle'
import { PLUGIN_KEY } from './constants'

const __ = i18next.getFixedT(null, [PLUGIN_KEY, 'resources'])

const { Ship, ShipOwner, Formation, Engagement, AirControl, StageType } = Models

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

const updateByStageHp = (fleet, nowhps) => {
  if (!fleet || !nowhps) {
    return fleet
  }
  return fleet.map((ship, i) =>
    !ship
      ? ship
      : {
          ...ship,
          stageHP: nowhps[i],
        },
  )
}

export const transformToLibBattleClass = (fleets, equips) =>
  (fleets || [])
    .map((fleet, fleetPos) =>
      (fleet || []).map(([_ship, $ship] = [], shipPos) =>
        !_ship
          ? null
          : new Ship({
              id: _ship.api_ship_id,
              owner: ShipOwner.Ours,
              pos: fleetPos * 6 + shipPos + 1,
              maxHP: _ship.api_maxhp,
              nowHP: _ship.api_nowhp,
              initHP: _ship.api_nowhp,
              lostHP: 0,
              damage: 0,
              items: equips[fleetPos][shipPos].map((e) =>
                e ? e[0].api_slotitem_id : null,
              ),
              useItem: null,
              baseParam: [
                $ship.api_houg[0] + _ship.api_kyouka[0],
                $ship.api_raig[0] + _ship.api_kyouka[1],
                $ship.api_tyku[0] + _ship.api_kyouka[2],
                $ship.api_souk[0] + _ship.api_kyouka[3],
              ],
              finalParam: [
                _ship.api_karyoku[0],
                _ship.api_raisou[0],
                _ship.api_taiku[0],
                _ship.api_soukou[0],
              ],
              raw: {
                ...$ship,
                ..._ship,
                poi_slot: equips[fleetPos][shipPos].map(([equip] = []) =>
                  equip && equip.api_id !== _ship.api_slot_ex ? equip : null,
                ),
                poi_slot_ex:
                  _.find(
                    equips[fleetPos][shipPos],
                    ([equip] = []) => equip?.api_id === _ship.api_slot_ex,
                  )?.[0] || null,
              },
            }),
      ),
    )
    .concat([undefined, undefined])
    .slice(0, 2)

export const transformToDazzyDingClass = (fleets, equips) =>
  (fleets || [])
    .map((fleet, fleetPos) =>
      (fleet || []).map(([_ship, $ship] = [], shipPos) =>
        !_ship
          ? null
          : {
              ...$ship,
              ..._ship,
              poi_slot: equips[fleetPos][shipPos].map((e) => (e ? e[0] : null)),
              poi_slot_ex: null,
            },
      ),
    )
    .concat([undefined, undefined])
    .slice(0, 2)

const updateIfExist = (obj, key, prev) => _.get(obj, key, prev)

// extracts necessary information
// infomation: mvp, formation, aerial, hp (day and night)
export const synthesizeInfo = (_simulator, result, packets) => {
  let { mainFleet, escortFleet, enemyFleet, enemyEscort } = { ..._simulator }
  const { stages } = { ..._simulator }
  let airForce = [0, 0, 0, 0] // [fPlaneInit, fLost, ePlaneInit, eLost]
  let airControl = ''
  let fFormation = ''
  let eFormation = ''
  let battleForm = ''
  // assign mvp to specific ship
  const [mainMvp, escortMvp] = result.mvp || [0, 0]
  if (!(mainMvp < 0 || mainMvp > 6)) mainFleet[mainMvp].isMvp = true
  if (!(escortMvp < 0 || escortMvp > 6)) escortFleet[escortMvp].isMvp = true

  let fResidule = 0
  let fLost = 0
  let eResidule = 0
  let eLost = 0

  _.each(stages, (stage) => {
    if (_.isNil(stage)) return
    const { engagement, aerial, type } = stage || {}

    if (engagement && type === StageType.Engagement) {
      // There might be multiple engagements (day and night)
      // fortunately the formation is the same for now
      battleForm = (engagement || {}).engagement || ''
      eFormation = (engagement || {}).eFormation || ''
      fFormation = (engagement || {}).fFormation || ''
    }

    if (aerial && type === StageType.Aerial) {
      // There might be multiple aerial stages, e.g. jet assult, 1-6 air battle
      const { fPlaneInit, fPlaneNow, ePlaneInit, ePlaneNow, control } = aerial
      // [t_api_f_count, t_api_f_lostcount, t_api_e_count, t_api_e_lostcount]
      fResidule = fPlaneNow
      eResidule = ePlaneNow
      fLost += (fPlaneInit || 0) - (fPlaneNow || 0)
      eLost += (ePlaneInit || 0) - (ePlaneNow || 0)
      // [fPlaneInit, fLost, ePlaneInit, eLost]
      airControl = control || ''
    }
  })

  airForce = [fResidule + fLost, fLost, eResidule + eLost, eLost]

  let api_f_nowhps
  let api_e_nowhps
  let api_f_nowhps_combined
  let api_e_nowhps_combined
  _.each(packets, (packet) => {
    api_f_nowhps = updateIfExist(packet, 'api_f_nowhps', api_f_nowhps)
    api_e_nowhps = updateIfExist(packet, 'api_e_nowhps', api_e_nowhps)
    api_f_nowhps_combined = updateIfExist(
      packet,
      'api_f_nowhps_combined',
      api_f_nowhps_combined,
    )
    api_e_nowhps_combined = updateIfExist(
      packet,
      'api_e_nowhps_combined',
      api_e_nowhps_combined,
    )
  })

  mainFleet = updateByStageHp(mainFleet, api_f_nowhps)
  enemyFleet = updateByStageHp(enemyFleet, api_e_nowhps)

  escortFleet = updateByStageHp(escortFleet, api_f_nowhps_combined)
  enemyEscort = updateByStageHp(enemyEscort, api_e_nowhps_combined)

  return {
    mainFleet,
    escortFleet,
    enemyFleet,
    enemyEscort,
    airControl,
    airForce,
    battleForm,
    eFormation,
    fFormation,
    result,
  }
}

export const getAirForceStatus = (stages = []) => {
  let t_api_f_count = 0
  let t_api_f_lostcount = 0
  let t_api_e_count = 0
  let t_api_e_lostcount = 0
  stages.forEach((stage) => {
    if (stage) {
      const {
        api_f_count,
        api_f_lostcount,
        api_e_count,
        api_e_lostcount,
      } = stage
      t_api_f_count = Math.max(t_api_f_count, api_f_count || 0)
      t_api_f_lostcount += api_f_lostcount || 0
      t_api_e_count = Math.max(t_api_e_count, api_e_count || 0)
      t_api_e_lostcount += api_e_lostcount || 0
    }
  })
  return [t_api_f_count, t_api_f_lostcount, t_api_e_count, t_api_e_lostcount]
}
