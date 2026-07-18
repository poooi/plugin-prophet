import _ from 'lodash'
import i18next from 'views/env-parts/i18next'
import {
  Models,
  type Ship,
  type Stage,
  type Simulator,
  type Formation,
  type Engagement,
  type AirControl,
  type Result,
  type RawFleetShip,
  type RawSlotItem,
} from 'poi-lib-battle'
import type { APIMstShip } from 'kcsapi/api_start2/getData/response'
import type { APIGetMemberShip2Response } from 'kcsapi/api_get_member/ship2/response'
import type { APISlotItem } from 'kcsapi/api_get_member/require_info/response'

import { getStore } from '../host/poi-store'
import { PLUGIN_KEY } from './constants'

const __ = i18next.getFixedT(null, [PLUGIN_KEY, 'resources'])

const { Ship: ShipClass, ShipOwner, Formation: FormationConst, Engagement: EngagementConst, AirControl: AirControlConst, StageType } = Models

// [apiShip, $ship] pair from poi fleet selectors
type FleetShipPair = [APIGetMemberShip2Response, APIMstShip] | null | undefined
// [apiSlotItem, ...rest] pair from poi equip selectors
type EquipSlot = [APISlotItem | null | undefined, ...unknown[]] | null | undefined

export const initEnemy = (
  intl = 0,
  api_ship_ke: number[] = [],
  api_eSlot: number[][],
  api_maxhps: number[],
  api_nowhps: number[],
  api_ship_lv: number[],
): (Ship | null)[] => {
  if (api_ship_ke == null) return []
  const fleet: (Ship | null)[] = []
  _.range(api_ship_ke.length).forEach((i) => {
    const id = api_ship_ke[i]
    const slots = api_eSlot[i] || []
    let ship: Ship | null = null
    if (Number.isInteger(id) && id > 0) {
      const raw = {
        api_ship_id: id,
        api_lv: api_ship_lv[i],
        poi_slot: slots.map((slotId: number) => getStore<RawSlotItem | null>(`const.$equips.${slotId}`, null)),
      }
      ship = new ShipClass({
        id,
        owner: ShipOwner.Enemy,
        pos: intl + i,
        maxHP: api_maxhps[i],
        nowHP: api_nowhps[i],
        items: [],
        raw,
      })
    }
    fleet.push(ship)
  })
  return fleet
}

export const AttackType = {
  Normal: 'Normal',
  Laser: 'Laser',
  Double: 'Double',
  Primary_Secondary_CI: 'PSCI',
  Primary_Radar_CI: 'PRCI',
  Primary_AP_CI: 'PACI',
  Primary_Primary_CI: 'PrCI',
  Primary_Torpedo_CI: 'PTCI',
  Torpedo_Torpedo_CI: 'TTCI',
} as const

type AttackTypeValue = (typeof AttackType)[keyof typeof AttackType]

export const getAttackTypeName = (type: AttackTypeValue | string): string => {
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

const FormationName: Record<string, string> = {
  [FormationConst.Ahead]: __('Line Ahead'),
  [FormationConst.Double]: __('Double Line'),
  [FormationConst.Diamond]: __('Diamond'),
  [FormationConst.Echelon]: __('Echelon'),
  [FormationConst.Abreast]: __('Line Abreast'),
  [FormationConst.Vanguard]: __('Vanguard'),
  [FormationConst.CruisingAntiSub]: __('Cruising Formation 1'),
  [FormationConst.CruisingForward]: __('Cruising Formation 2'),
  [FormationConst.CruisingDiamond]: __('Cruising Formation 3'),
  [FormationConst.CruisingBattle]: __('Cruising Formation 4'),
}

const EngagementName: Record<string, string> = {
  [EngagementConst.Parallel]: __('Parallel Engagement'),
  [EngagementConst.Headon]: __('Head-on Engagement'),
  [EngagementConst.TAdvantage]: __('Crossing the T (Advantage)'),
  [EngagementConst.TDisadvantage]: __('Crossing the T (Disadvantage)'),
}

const AirControlName: Record<string, string> = {
  [AirControlConst.Parity]: __('Air Parity'),
  [AirControlConst.Supremacy]: __('Air Supremacy'),
  [AirControlConst.Superiority]: __('Air Superiority'),
  [AirControlConst.Denial]: __('Air Denial'),
  [AirControlConst.Incapability]: __('Air Incapability'),
}

const translation: Record<string, string> = {
  ...FormationName,
  ...EngagementName,
  ...AirControlName,
}

export const _t = (str: string): string => translation[str] ?? str

const updateByStageHp = (
  fleet: (Ship | null)[] | undefined | null,
  nowhps: number[] | undefined,
): (Ship | null)[] | undefined | null => {
  if (!fleet || !nowhps) return fleet
  return fleet.map((ship, i) =>
    !ship ? ship : { ...ship, stageHP: nowhps[i] },
  )
}

export const transformToLibBattleClass = (
  fleets: (FleetShipPair[] | null | undefined)[] | null | undefined,
  equips: (EquipSlot[] | null | undefined)[][] | null | undefined,
): [(Ship | null)[], (Ship | null)[]] => {
  const result = (fleets || [])
    .map((fleet, fleetPos) =>
      (fleet || []).map((pair, shipPos) => {
        const [_ship, $ship] = pair ?? []
        if (!_ship) return null
        const shipEquips = equips?.[fleetPos]?.[shipPos] ?? []
        return new ShipClass({
          id: _ship.api_ship_id,
          owner: ShipOwner.Ours,
          pos: fleetPos * 6 + shipPos + 1,
          maxHP: _ship.api_maxhp,
          nowHP: _ship.api_nowhp,
          lostHP: 0,
          damage: 0,
          items: shipEquips.map((e) =>
            e?.[0] ? e[0].api_slotitem_id : null,
          ),
          useItem: null,
          baseParam: [
            ($ship?.api_houg?.[0] ?? 0) + (_ship.api_kyouka[0] ?? 0),
            ($ship?.api_raig?.[0] ?? 0) + (_ship.api_kyouka[1] ?? 0),
            ($ship?.api_tyku?.[0] ?? 0) + (_ship.api_kyouka[2] ?? 0),
            ($ship?.api_souk?.[0] ?? 0) + (_ship.api_kyouka[3] ?? 0),
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
            poi_slot: shipEquips.map((e) => {
              const equip = e?.[0]
              return equip && equip.api_id !== _ship.api_slot_ex ? equip : null
            }),
            poi_slot_ex:
              _.find(
                shipEquips,
                (e) => e?.[0] != null && (e[0] as APISlotItem).api_id === _ship.api_slot_ex,
              )?.[0] as RawSlotItem | null ?? null,
          } as unknown as RawFleetShip,
        })
      }),
    )
  const [fleet1, fleet2] = result
  return [fleet1 ?? [], fleet2 ?? []]
}

export const transformToDazzyDingClass = (
  fleets: (FleetShipPair[] | null | undefined)[] | null | undefined,
  equips: (EquipSlot[] | null | undefined)[][] | null | undefined,
): [(RawFleetShip | null)[], (RawFleetShip | null)[]] => {
  const result = (fleets || [])
    .map((fleet, fleetPos) =>
      (fleet || []).map((pair, shipPos) => {
        const [_ship, $ship] = pair ?? []
        if (!_ship) return null
        const shipEquips = equips?.[fleetPos]?.[shipPos] ?? []
        return {
          ...$ship,
          ..._ship,
          poi_slot: shipEquips.map((e) => (e?.[0] ? e[0] : null)),
          poi_slot_ex: null,
        } as RawFleetShip
      }),
    )
  const [fleet1, fleet2] = result
  return [fleet1 ?? [], fleet2 ?? []]
}

const updateIfExist = (obj: Record<string, unknown>, key: string, prev: number[] | undefined): number[] | undefined => {
  const val = _.get(obj, key)
  return val !== undefined ? (val as number[]) : prev
}

export const synthesizeInfo = (
  _simulator: Simulator,
  result: Result,
  packets: Record<string, unknown>[],
): {
  mainFleet: (Ship | null)[] | undefined
  escortFleet: (Ship | null)[] | undefined
  enemyFleet: (Ship | null)[] | null
  enemyEscort: (Ship | null)[] | null
  airControl: AirControl | ''
  airForce: number[]
  battleForm: Engagement | ''
  eFormation: Formation | ''
  fFormation: Formation | ''
  smokeType: number
  result: Result
} => {
  let mainFleet = _simulator.mainFleet
  let escortFleet = _simulator.escortFleet
  let enemyFleet = _simulator.enemyFleet
  let enemyEscort = _simulator.enemyEscort
  const { stages } = _simulator
  let airForce = [0, 0, 0, 0]
  let airControl: AirControl | '' = ''
  let fFormation: Formation | '' = ''
  let eFormation: Formation | '' = ''
  let battleForm: Engagement | '' = ''
  let smokeType = 0

  const [mainMvp, escortMvp] = result.mvp ?? [0, 0]
  if (mainFleet && !(mainMvp < 0 || mainMvp > 6)) {
    const s = mainFleet[mainMvp]
    if (s) s.isMvp = true
  }
  if (escortFleet && !(escortMvp < 0 || escortMvp > 6)) {
    const s = escortFleet[escortMvp]
    if (s) s.isMvp = true
  }

  let fResidule = 0
  let fLost = 0
  let eResidule = 0
  let eLost = 0

  _.each(stages, (stage: Stage | null) => {
    if (stage == null) return
    const { engagement, aerial, type } = stage

    if (engagement && type === StageType.Engagement) {
      battleForm = engagement.engagement ?? ''
      eFormation = engagement.eFormation ?? ''
      fFormation = engagement.fFormation ?? ''
      smokeType = engagement.smokeType ?? 0
    }

    if (aerial && type === StageType.Aerial) {
      const { fPlaneInit, fPlaneNow, ePlaneInit, ePlaneNow, control } = aerial
      fResidule = fPlaneNow ?? 0
      eResidule = ePlaneNow ?? 0
      fLost += (fPlaneInit ?? 0) - (fPlaneNow ?? 0)
      eLost += (ePlaneInit ?? 0) - (ePlaneNow ?? 0)
      airControl = control ?? ''
    }
  })

  airForce = [fResidule + fLost, fLost, eResidule + eLost, eLost]

  let api_f_nowhps: number[] | undefined
  let api_e_nowhps: number[] | undefined
  let api_f_nowhps_combined: number[] | undefined
  let api_e_nowhps_combined: number[] | undefined
  _.each(packets, (packet) => {
    api_f_nowhps = updateIfExist(packet, 'api_f_nowhps', api_f_nowhps)
    api_e_nowhps = updateIfExist(packet, 'api_e_nowhps', api_e_nowhps)
    api_f_nowhps_combined = updateIfExist(packet, 'api_f_nowhps_combined', api_f_nowhps_combined)
    api_e_nowhps_combined = updateIfExist(packet, 'api_e_nowhps_combined', api_e_nowhps_combined)
  })

  mainFleet = updateByStageHp(mainFleet, api_f_nowhps) as typeof mainFleet
  enemyFleet = updateByStageHp(enemyFleet, api_e_nowhps) as typeof enemyFleet
  escortFleet = updateByStageHp(escortFleet, api_f_nowhps_combined) as typeof escortFleet
  enemyEscort = updateByStageHp(enemyEscort, api_e_nowhps_combined) as typeof enemyEscort

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
    smokeType,
    result,
  }
}

type AirStage = {
  api_f_count?: number
  api_f_lostcount?: number
  api_e_count?: number
  api_e_lostcount?: number
} | null | undefined

export const getAirForceStatus = (stages: AirStage[] = []): number[] => {
  let t_api_f_count = 0
  let t_api_f_lostcount = 0
  let t_api_e_count = 0
  let t_api_e_lostcount = 0
  stages.forEach((stage) => {
    if (stage) {
      const { api_f_count, api_f_lostcount, api_e_count, api_e_lostcount } = stage
      t_api_f_count = Math.max(t_api_f_count, api_f_count ?? 0)
      t_api_f_lostcount += api_f_lostcount ?? 0
      t_api_e_count = Math.max(t_api_e_count, api_e_count ?? 0)
      t_api_e_lostcount += api_e_lostcount ?? 0
    }
  })
  return [t_api_f_count, t_api_f_lostcount, t_api_e_count, t_api_e_lostcount]
}
