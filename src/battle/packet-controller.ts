/**
 * Packet controller: processes game.response events and maintains battle state.
 * No React or Redux dependencies. Side effects (notifications, dispatch) are
 * handled through injected callbacks.
 */
import { first, concat, includes } from 'lodash'
import {
  Battle,
  BattleType,
  Ship,
  ShipOwner,
  Simulator,
  AirControlMap,
  FormationMap,
  EngagementMap,
  buildFleet,
  initEnemyShips,
  extractAirForce,
  extractAirControl,
  extractEngagement,
  updateStageHp,
  createBattle,
} from './lib-battle-adapter'
import type { RawFleetShip } from '../../lib/battle'
import { SortieState } from './battle-view-model'

export interface PacketControllerDependencies {
  onBattleResult: (opts: { spot: string; title: string; fFormation: string; smokeType: number }) => void
  onGetPracticeInfo: (opts: { title: string }) => void
  notify: (message: string, opts?: { type: string; icon?: string; audio?: string }) => void
  getT: (key: string) => string
  getShipName: (shipId: number) => string
  getEscapedPos: () => number[]
  getSortieMapId: () => string
  getCurrentNode: () => number
  getSortieState: () => SortieState
  showAirRaid: () => boolean
  getAirbase: () => import('../host/poi-types').AirbaseInfo[]
  getPluginAsset: (relative: string) => string
  getHostAsset: (relative: string) => string
  notifyEnabled: () => boolean
  notifyAudio: () => string | undefined
}

export interface BattleStateSnapshot {
  mainFleet: Array<Ship | null>
  escortFleet: Array<Ship | null>
  enemyFleet: Array<Ship | null>
  enemyEscort: Array<Ship | null>
  landBase: Array<Ship | null>
  airForce: [number, number, number, number]
  airControl: string
  isBaseDefense: boolean
  isHeavyBomberDefense: boolean
  sortieState: SortieState
  mapAreaId: number
  eventId: number
  eventKind: number
  result: ResultSnapshot
  battleForm: string
  eFormation: string
  fFormation: string
  smokeType: number
  /** MVP positions [mainMvpIdx, escortMvpIdx], -1 means none */
  mvpPos: [number, number]
}

export interface ResultSnapshot {
  rank: string
  getShip?: number
  getItem?: number
  mvp?: [number, number]
}

const initState: BattleStateSnapshot = {
  mainFleet: [],
  escortFleet: [],
  enemyFleet: [],
  enemyEscort: [],
  landBase: [],
  airForce: [0, 0, 0, 0],
  airControl: '',
  isBaseDefense: false,
  isHeavyBomberDefense: false,
  sortieState: SortieState.InPort,
  mapAreaId: 0,
  eventId: 0,
  eventKind: 0,
  result: { rank: '' },
  battleForm: '',
  eFormation: '',
  fFormation: '',
  smokeType: 0,
  mvpPos: [-1, -1],
}

type FleetData = Array<Array<[unknown, unknown] | undefined> | undefined>
type EquipData = Array<Array<Array<[unknown, unknown] | undefined> | undefined> | undefined>

export class PacketController {
  private _battle: Battle | null = null
  private _state: BattleStateSnapshot
  private _propsFleets: FleetData = []
  private _propsEquips: EquipData = []
  private _combinedFlag: number = 0
  private _deps: PacketControllerDependencies

  constructor(deps: PacketControllerDependencies) {
    this._deps = deps
    this._state = { ...initState }
  }

  getState(): BattleStateSnapshot {
    return this._state
  }

  initFleets(
    fleets: FleetData,
    equips: EquipData,
    combinedFlag: number,
  ): void {
    this._propsFleets = fleets
    this._propsEquips = equips
    this._combinedFlag = combinedFlag
    const fleet = buildFleet(fleets as never, equips as never, combinedFlag)
    const mainFleet = (new Simulator(fleet, { usePoiAPI: true })).mainFleet ?? []
    const escortFleet = (new Simulator(fleet, { usePoiAPI: true })).escortFleet ?? []
    this._state = {
      ...this._state,
      mainFleet: mainFleet as Array<Ship | null>,
      escortFleet: escortFleet as Array<Ship | null>,
    }
  }

  updateFleets(fleets: FleetData, equips: EquipData, combinedFlag: number): void {
    if (JSON.stringify(fleets) === JSON.stringify(this._propsFleets) &&
        JSON.stringify(equips) === JSON.stringify(this._propsEquips)) {
      return
    }
    this._propsFleets = fleets
    this._propsEquips = equips
    this._combinedFlag = combinedFlag
    const fleet = buildFleet(fleets as never, equips as never, combinedFlag)
    const sim = new Simulator(fleet, { usePoiAPI: true })
    this._state = {
      ...this._state,
      mainFleet: (sim.mainFleet ?? []) as Array<Ship | null>,
      escortFleet: (sim.escortFleet ?? []) as Array<Ship | null>,
    }
  }

  handleGameResponse(
    path: string,
    body: Record<string, unknown>,
    fleets: FleetData,
    equips: EquipData,
    combinedFlag: number,
  ): void {
    let updateFleetFromLibBattle = !!this._battle
    const state = { ...this._state }
    let isBaseDefense = false
    let isHeavyBomberDefense = state.isHeavyBomberDefense

    switch (path) {
      case '/kcsapi/api_start2/getData':
      case '/kcsapi/api_port/port':
        this._battle = null
        Object.assign(state, {
          enemyFleet: initState.enemyFleet,
          enemyEscort: initState.enemyEscort,
          sortieState: initState.sortieState,
          eventId: initState.eventId,
          eventKind: initState.eventKind,
          result: initState.result,
          airForce: initState.airForce,
        })
        updateFleetFromLibBattle = false
        break

      case '/kcsapi/api_req_map/start':
      case '/kcsapi/api_req_map/next':
      case '/kcsapi/api_req_map/air_raid': {
        const { api_event_kind, api_event_id, api_destruction_battle, api_maparea_id, api_destruction_flag } = body
        isHeavyBomberDefense = api_destruction_flag === 1 || path === '/kcsapi/api_req_map/air_raid'
        state.sortieState = SortieState.Navigation
        if (api_event_id !== undefined) state.eventId = api_event_id as number
        if (api_event_kind !== undefined) state.eventKind = api_event_kind as number
        if (api_maparea_id !== undefined) state.mapAreaId = api_maparea_id as number
        Object.assign(state, {
          enemyFleet: initState.enemyFleet,
          enemyEscort: initState.enemyEscort,
          landBase: initState.landBase,
          airForce: initState.airForce,
        })

        if (this._deps.showAirRaid() && api_destruction_battle != null) {
          const destructionBattles = Array.isArray(api_destruction_battle)
            ? (api_destruction_battle as Record<string, unknown>[])
            : [api_destruction_battle as Record<string, unknown>]

          for (const destructionBattle of destructionBattles) {
            const {
              api_air_base_attack,
              api_f_maxhps,
              api_f_nowhps,
              api_ship_ke,
              api_eSlot,
              api_e_maxhps,
              api_e_nowhps,
              api_ship_lv,
              api_lost_kind,
              api_formation,
              api_stage1,
              api_stage3,
            } = destructionBattle as Record<string, unknown>

            const airbase = this._deps.getAirbase()
            state.landBase = airbase
              .filter((squad) => squad.api_area_id === state.mapAreaId)
              .map((squad) => new Ship({
                id: -1,
                owner: ShipOwner.Ours,
                pos: squad.api_rid,
                maxHP: ((api_f_maxhps as number[])?.[squad.api_rid - 1]) ?? 200,
                nowHP: ((api_f_nowhps as number[])?.[squad.api_rid - 1]) ?? 0,
                lostHP: 0,
                damage: 0,
                items: squad.api_plane_info.map((p) => p.api_slotid),
                raw: squad as unknown as RawFleetShip,
              }))

            state.enemyFleet = initEnemyShips(
              0,
              api_ship_ke as number[],
              api_eSlot as number[][],
              api_e_maxhps as number[],
              api_e_nowhps as number[],
              api_ship_lv as number[],
            )

            const formation = api_formation as number[] | undefined
            state.battleForm = EngagementMap[(formation ?? [])[2] ?? -1] ?? ''
            state.eFormation = FormationMap[(formation ?? [])[1] ?? -1] ?? ''

            const parsedAirBaseAttack = typeof api_air_base_attack === 'string'
              ? (JSON.parse(api_air_base_attack) as Record<string, unknown>)
              : api_air_base_attack as Record<string, unknown>

            const stages = [
              parsedAirBaseAttack?.['api_stage1'] as Record<string, unknown>,
              parsedAirBaseAttack?.['api_stage2'] as Record<string, unknown>,
              parsedAirBaseAttack?.['api_stage3'] as Record<string, unknown>,
            ]
            state.airForce = getAirForceFromStages(stages)
            state.airControl = AirControlMap[((api_stage1 as Record<string, unknown>)?.['api_disp_seiku'] as number)] ?? ''

            if (api_stage3 != null) {
              const apiFdam = (api_stage3 as Record<string, unknown>)['api_fdam'] as number[] | undefined
              state.landBase = state.landBase.map((squad, idx) => {
                if (!squad) return squad
                const lostHP = apiFdam?.[idx] ?? 0
                return { ...squad, lostHP, nowHP: squad.nowHP - lostHP } as Ship
              })
            } else {
              state.landBase = state.landBase.map((squad) =>
                squad ? { ...squad, lostHP: 0 } as Ship : squad,
              )
            }

            const lostKindMap: Record<number, string> = {
              1: 'Resources sustained losses',
              2: 'Resources and land-based air squadrons sustained losses',
              3: 'Land-based air squadrons sustained losses',
              4: 'No damage was inflicted',
            }
            state.result = { rank: this._deps.getT(lostKindMap[api_lost_kind as number] ?? '') }
            isBaseDefense = true
          }
        }

        const isBoss = body['api_event_id'] === 5
        this._battle = createBattle(isBoss ? BattleType.Boss : BattleType.Normal)
        updateFleetFromLibBattle = false
        break
      }

      case '/kcsapi/api_req_map/start_air_base':
        updateFleetFromLibBattle = false
        break

      case '/kcsapi/api_req_member/get_practice_enemyinfo':
        this._deps.onGetPracticeInfo({ title: body['api_deckname'] as string ?? '' })
        updateFleetFromLibBattle = false
        break

      case '/kcsapi/api_req_practice/battle':
        this._battle = createBattle(BattleType.Practice)
        updateFleetFromLibBattle = true
        break

      default:
        break
    }

    if (updateFleetFromLibBattle && this._battle) {
      const packet = { ...body, poi_path: path }

      if (!this._battle.fleet) {
        this._battle.fleet = buildFleet(fleets as never, equips as never, combinedFlag)
      }
      if (!this._battle.packet) {
        this._battle.packet = []
      }
      this._battle.packet.push(packet)

      if (path.includes('result')) {
        const title = ((body['api_enemy_info'] as Record<string, unknown> | undefined)?.['api_deck_name'] as string) ?? ''
        const spot = path.includes('practice')
          ? 'practice'
          : `${this._deps.getSortieMapId()}-${this._deps.getCurrentNode()}`

        const newState = this._processPacket(this._battle)
        Object.assign(state, newState)

        this._deps.onBattleResult({
          spot,
          title,
          fFormation: newState.fFormation ?? '',
          smokeType: newState.smokeType ?? 0,
        })

        this._notifyDamage(state, path)
        this._battle = null
      } else {
        const newState = this._processPacket(this._battle)
        Object.assign(state, newState)
      }
    } else if (
      JSON.stringify(fleets) !== JSON.stringify(this._propsFleets) ||
      JSON.stringify(equips) !== JSON.stringify(this._propsEquips)
    ) {
      this._propsFleets = fleets
      this._propsEquips = equips
      this._combinedFlag = combinedFlag
      const fleet = buildFleet(fleets as never, equips as never, combinedFlag)
      const sim = new Simulator(fleet, { usePoiAPI: true })
      state.mainFleet = (sim.mainFleet ?? []) as Array<Ship | null>
      state.escortFleet = (sim.escortFleet ?? []) as Array<Ship | null>
    }

    state.isBaseDefense = isBaseDefense
    state.isHeavyBomberDefense = isHeavyBomberDefense
    this._state = state
  }

  private _processPacket(battle: Battle): Partial<BattleStateSnapshot> {
    const sim = new Simulator(battle.fleet!, { usePoiAPI: true })
    for (const packet of battle.packet ?? []) {
      sim.simulate(packet)
    }

    const { result, stages, mainFleet, escortFleet, enemyFleet, enemyEscort } = sim

    // Correct flagship HP for repair item usage
    if (battle.packet && battle.packet.length > 0) {
      const firstPacket = battle.packet[0] as Record<string, unknown>
      const apiFNowhps = firstPacket['api_f_nowhps'] as number[] | undefined
      const apiFMaxhps = firstPacket['api_f_maxhps'] as number[] | undefined
      const nowHP = first(apiFNowhps)
      const flagship = mainFleet?.[0]
      if (flagship && flagship.nowHP !== nowHP && nowHP !== undefined) {
        const maxHP = first(apiFMaxhps)
        flagship.useItem = maxHP === nowHP ? 43 : 42
        flagship.initHP = nowHP
        flagship.nowHP = nowHP
      }
    }

    const [fInit, fLost, eInit, eLost] = extractAirForce(stages)
    const airControl = extractAirControl(stages)
    const { battleForm, eFormation, fFormation, smokeType } = extractEngagement(stages)

    // Update stageHP from last available HP arrays
    let apiFNowhps: number[] | undefined
    let apiENowhps: number[] | undefined
    let apiFNowhpsCombined: number[] | undefined
    let apiENowhpsCombined: number[] | undefined

    for (const packet of battle.packet ?? []) {
      const p = packet as Record<string, unknown>
      if (p['api_f_nowhps']) apiFNowhps = p['api_f_nowhps'] as number[]
      if (p['api_e_nowhps']) apiENowhps = p['api_e_nowhps'] as number[]
      if (p['api_f_nowhps_combined']) apiFNowhpsCombined = p['api_f_nowhps_combined'] as number[]
      if (p['api_e_nowhps_combined']) apiENowhpsCombined = p['api_e_nowhps_combined'] as number[]
    }

    const resultSnapshot: ResultSnapshot = result
      ? { rank: result.rank ?? '', getShip: result.getShip, getItem: result.getItem, mvp: result.mvp ?? [0, 0] }
      : { rank: '' }

    const mvpPos: [number, number] = result?.mvp
      ? [result.mvp[0] ?? -1, result.mvp[1] ?? -1]
      : [-1, -1]

    return {
      mainFleet: updateStageHp(mainFleet as Array<Ship | null>, apiFNowhps),
      escortFleet: updateStageHp(escortFleet as Array<Ship | null>, apiFNowhpsCombined),
      enemyFleet: updateStageHp(enemyFleet as Array<Ship | null>, apiENowhps),
      enemyEscort: updateStageHp(enemyEscort as Array<Ship | null>, apiENowhpsCombined),
      airForce: [fInit, fLost, eInit, eLost],
      airControl,
      battleForm,
      eFormation,
      fFormation,
      smokeType,
      result: resultSnapshot,
      mvpPos,
      sortieState: this._state.sortieState === SortieState.Navigation
        ? (battle.type === BattleType.Practice ? SortieState.Practice : SortieState.Battle)
        : this._deps.getSortieState(),
    }
  }

  private _notifyDamage(state: BattleStateSnapshot, path: string): void {
    if (path.includes('practice')) return
    if (!this._deps.notifyEnabled()) return

    const escapedPos = this._deps.getEscapedPos()
    const friendShips = concat(state.mainFleet ?? [], state.escortFleet ?? [])
    const damageList: string[] = []

    for (const ship of friendShips) {
      if (!ship) continue
      if (ship.nowHP / ship.maxHP <= 0.25 && !includes(escapedPos, ship.pos - 1)) {
        const shipName = this._deps.getShipName((ship.raw as Record<string, unknown>)?.['api_ship_id'] as number ?? 0)
        damageList.push(this._deps.getT(shipName))
      }
    }

    if (damageList.length > 0) {
      this._deps.notify(`${damageList.join(', ')} ${this._deps.getT('Heavily damaged')}`, {
        type: 'damaged',
        icon: this._deps.getHostAsset('./views/components/main/assets/img/state/4.png'),
        audio: this._deps.notifyAudio(),
      })
    }
  }
}

function getAirForceFromStages(stages: Array<Record<string, unknown> | null | undefined>): [number, number, number, number] {
  let fCount = 0
  let fLost = 0
  let eCount = 0
  let eLost = 0
  for (const stage of stages) {
    if (!stage) continue
    fCount = Math.max(fCount, (stage['api_f_count'] as number) ?? 0)
    fLost += (stage['api_f_lostcount'] as number) ?? 0
    eCount = Math.max(eCount, (stage['api_e_count'] as number) ?? 0)
    eLost += (stage['api_e_lostcount'] as number) ?? 0
  }
  return [fCount, fLost, eCount, eLost]
}
