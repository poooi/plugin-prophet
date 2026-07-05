/**
 * Adapter between Poi host data and the new TypeScript lib-battle.
 * Only this file may import production lib-battle.
 */
import {
  Fleet,
  Battle,
  BattleType,
  Ship,
  ShipOwner,
  Stage,
  StageType,
  AirControl,
  EngagementInfo,
  Simulator,
  Result,
  type RawFleetShip,
} from '../../lib/battle'

export type {
  Stage,
  Result,
  EngagementInfo,
}

export { Fleet, Battle, BattleType, Ship, ShipOwner, StageType, AirControl, Simulator }

export interface PoiFleetShip {
  _ship: {
    api_ship_id: number
    api_nowhp: number
    api_maxhp: number
    api_kyouka: number[]
    api_karyoku: number[]
    api_raisou: number[]
    api_taiku: number[]
    api_soukou: number[]
    api_slot_ex: number
    api_id: number
    [key: string]: unknown
  }
  $ship: {
    api_houg: number[]
    api_raig: number[]
    api_tyku: number[]
    api_souk: number[]
    [key: string]: unknown
  }
  equips: Array<[PoiEquipItem, { api_id: number; [key: string]: unknown }] | undefined>
}

export interface PoiEquipItem {
  api_slotitem_id: number
  api_id: number
  [key: string]: unknown
}

/**
 * Convert Poi ship/equip data to RawFleetShip for lib-battle.
 */
export function buildRawFleetShip(
  _ship: PoiFleetShip['_ship'],
  $ship: PoiFleetShip['$ship'],
  equips: PoiFleetShip['equips'],
): RawFleetShip {
  const findEx = equips.find((e) => e && e[0]?.api_id === _ship.api_slot_ex)
  return {
    ...$ship,
    ..._ship,
    poi_slot: equips.map((e) => (e ? e[0] : null)) as RawFleetShip['poi_slot'],
    poi_slot_ex: findEx ? findEx[0] : null,
  } as unknown as RawFleetShip
}

/**
 * Build a lib-battle Fleet from Poi fleet/equip data.
 * Returns [mainFleet, escortFleet] where fleets are arrays of RawFleetShip.
 */
export function buildFleet(
  fleets: Array<Array<[{ api_ship_id: number; api_nowhp: number; api_maxhp: number; api_kyouka: number[]; api_slot_ex: number; api_id: number; [key: string]: unknown }, { api_houg: number[]; api_raig: number[]; api_tyku: number[]; api_souk: number[]; [key: string]: unknown }] | undefined> | undefined>,
  equips: Array<Array<Array<[PoiEquipItem, { api_id: number; [key: string]: unknown }] | undefined> | undefined> | undefined>,
  combinedFlag: number,
): Fleet {
  const buildRawFleet = (fleetIdx: number): Array<RawFleetShip | null> => {
    const fleet = fleets[fleetIdx]
    const fleetEquips = equips[fleetIdx]
    if (!fleet) return []
    return fleet.map((entry, shipPos) => {
      if (!entry) return null
      const [_ship, $ship] = entry
      if (!_ship) return null
      const shipEquips = fleetEquips?.[shipPos] ?? []
      return buildRawFleetShip(_ship as PoiFleetShip['_ship'], $ship as PoiFleetShip['$ship'], shipEquips as PoiFleetShip['equips'])
    })
  }

  const mainFleet = buildRawFleet(0)
  const escortFleet = buildRawFleet(1)

  return new Fleet({
    type: combinedFlag,
    main: mainFleet,
    escort: escortFleet.length > 0 ? escortFleet : [],
    support: [],
    LBAC: undefined,
  })
}

/**
 * Extract air force status from aerial stages.
 * Returns [fPlaneInit, fLost, ePlaneInit, eLost].
 */
export function extractAirForce(stages: Array<Stage | null>): [number, number, number, number] {
  let fResidual = 0
  let fLost = 0
  let eResidual = 0
  let eLost = 0

  for (const stage of stages) {
    if (!stage || stage.type !== StageType.Aerial) continue
    const aerial = stage.aerial
    if (!aerial) continue
    const { fPlaneInit, fPlaneNow, ePlaneInit, ePlaneNow } = aerial
    fResidual = fPlaneNow ?? 0
    eResidual = ePlaneNow ?? 0
    fLost += (fPlaneInit ?? 0) - (fPlaneNow ?? 0)
    eLost += (ePlaneInit ?? 0) - (ePlaneNow ?? 0)
  }

  return [fResidual + fLost, fLost, eResidual + eLost, eLost]
}

/**
 * Extract air control from stages.
 */
export function extractAirControl(stages: Array<Stage | null>): string {
  for (let i = stages.length - 1; i >= 0; i--) {
    const stage = stages[i]
    if (!stage || stage.type !== StageType.Aerial) continue
    const control = stage.aerial?.control
    if (control) return control
  }
  return ''
}

/**
 * Extract engagement info from stages.
 */
export function extractEngagement(stages: Array<Stage | null>): {
  battleForm: string
  eFormation: string
  fFormation: string
  smokeType: number
} {
  let battleForm = ''
  let eFormation = ''
  let fFormation = ''
  let smokeType = 0

  for (const stage of stages) {
    if (!stage || stage.type !== StageType.Engagement) continue
    const eng = stage.engagement
    if (eng) {
      battleForm = eng.engagement ?? ''
      eFormation = eng.eFormation ?? ''
      fFormation = eng.fFormation ?? ''
      smokeType = (eng as unknown as { smokeType?: number }).smokeType ?? 0
    }
  }
  return { battleForm, eFormation, fFormation, smokeType }
}

/**
 * Update fleet ships' stageHP from packet HP arrays.
 */
export function updateStageHp(
  fleet: Array<Ship | null> | null | undefined,
  nowhps: number[] | null | undefined,
): Array<Ship | null> {
  if (!fleet || !nowhps) return fleet ?? []
  return fleet.map((ship, i) => {
    if (!ship) return ship
    const newHp = nowhps[i]
    if (newHp === undefined) return ship
    return { ...ship, stageHP: newHp } as Ship
  })
}

/**
 * Create lib-battle Battle object for sortie.
 */
export function createBattle(type: typeof BattleType[keyof typeof BattleType]): Battle {
  return new Battle({
    type,
    map: [],
    desc: null,
    time: undefined,
    fleet: undefined,
    packet: [],
  })
}

/**
 * Initialize enemy ship manually (for air raid scenarios where lib-battle
 * does not construct the enemy fleet from packets).
 */
export function initEnemyShips(
  intl: number,
  api_ship_ke: number[] | undefined,
  api_eSlot: number[][] | undefined,
  api_maxhps: number[] | undefined,
  api_nowhps: number[] | undefined,
  api_ship_lv: number[] | undefined,
): Array<Ship | null> {
  if (!api_ship_ke) return []
  return api_ship_ke.map((id, i) => {
    const slots = (api_eSlot ?? [])[i] ?? []
    if (!Number.isInteger(id) || id <= 0) return null
    const raw = {
      api_ship_id: id,
      api_lv: (api_ship_lv ?? [])[i] ?? 0,
      poi_slot: slots.map((slotId) => window.$slotitems?.[slotId] ?? null),
    }
    return new Ship({
      id,
      owner: ShipOwner.Enemy,
      pos: intl + i,
      maxHP: (api_maxhps ?? [])[i] ?? 0,
      nowHP: (api_nowhps ?? [])[i] ?? 0,
      lostHP: 0,
      damage: 0,
      items: [],
      raw: raw as unknown as RawFleetShip,
    })
  })
}

export { Formation, Engagement, FormationMap, EngagementMap, AirControlMap, Rank } from '../../lib/battle'
export type { AerialInfo } from '../../lib/battle'
