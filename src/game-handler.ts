import { observe, observer } from 'redux-observers'
import _ from 'lodash'
import { isEqual, isNil, map, isEmpty } from 'lodash'
import i18next from 'views/env-parts/i18next'
import { Models, Battle, Fleet } from 'poi-lib-battle'
import type { RawFleetShip } from 'poi-lib-battle'

import { store } from 'views/create-store'

import { getHeavilyDamagedShipNames } from './battle/damage-notification'
import { simulateBattleDisplayState } from './battle/packet-controller'
import { getConfig } from './host/poi-config'
import { notify } from './host/poi-notification'
import { getStore } from './host/poi-store'
import {
  PLUGIN_KEY,
  initEnemy,
  lostKind,
  getAirForceStatus,
  transformToLibBattleClass,
  transformToDazzyDingClass,
  SortieState,
} from './utils'
import { resolvePoiHostAssetPath } from './host/poi-assets'
import {
  onPatchBattle,
  onBattleResult,
  onGetPracticeInfo,
  initBattleState,
  battleStateSelector,
  historyObserver,
} from './redux'
import type { BattleDisplayState } from './types'
import { selectFleetsEquips } from './selectors'

const {
  Ship: ShipClass,
  ShipOwner,
  BattleType,
  FormationMap,
  EngagementMap,
  AirControlMap,
} = Models

const t = i18next.getFixedT(null, [PLUGIN_KEY, 'resources'])

interface AirRaidDestructionBattle {
  api_air_base_attack?: string | {
    api_stage1?: { api_f_count?: number; api_f_lostcount?: number; api_e_count?: number; api_e_lostcount?: number } | null
    api_stage2?: { api_f_count?: number; api_f_lostcount?: number; api_e_count?: number; api_e_lostcount?: number } | null
    api_stage3?: { api_fdam?: number[] } | null
  }
  api_f_maxhps?: number[]
  api_f_nowhps?: number[]
  api_ship_ke?: number[]
  api_eSlot?: number[][]
  api_e_maxhps?: number[]
  api_e_nowhps?: number[]
  api_ship_lv?: number[]
  api_lost_kind?: number
  api_formation?: number[]
}

interface MapEventBody {
  api_event_kind?: number
  api_event_id?: number
  api_maparea_id?: number
  api_destruction_flag?: number
  api_destruction_battle?: AirRaidDestructionBattle | AirRaidDestructionBattle[]
}

interface BattleResultBody {
  api_enemy_info?: { api_deck_name?: string }
}

let battleRef: Battle | null = null
let unsubscribeObservers: (() => void) | null = null

const handlePacketResult = (battle: Battle): Partial<BattleDisplayState> => {
  const state = store.getState() as PoiRootState
  const { sortieState, mainFleet, escortFleet } = battleStateSelector(state)
  const escapedPos = state.sortie.escapedPos ?? []

  const newState = simulateBattleDisplayState(battle)
  const damageList = getHeavilyDamagedShipNames({
    mainFleet,
    escortFleet,
    escapedPos,
    sortieState,
    getShipName: (shipId) => getStore<string>(`const.$ships.${shipId}.api_name`, ' '),
    translate: t,
  })

  if (!isEmpty(damageList) && getConfig('plugin.prophet.notify.enable', true)) {
    notify(`${damageList.join(', ')} ${t('Heavily damaged')}`, {
      type: 'damaged',
      icon: resolvePoiHostAssetPath('./views/components/main/assets/img/state/4.png'),
      audio: getConfig('plugin.prophet.notify.damagedAudio'),
    })
  }
  return { ...newState }
}

const handleGameResponse = (e: Event): void => {
  const eventDetail = (e as CustomEvent<{ path: string; body: Record<string, unknown> }>).detail
  const { path, body } = eventDetail

  const state = store.getState() as PoiRootState
  const { fleets: _fleets, equips: _equips } = selectFleetsEquips(state)
  const _sortie = state.sortie
  const _showAirRaid = state.config?.plugin?.prophet?.showAirRaid ?? true
  const _airbase = state.info?.airbase ?? []

  const battleState = battleStateSelector(state)
  const { mainFleet, escortFleet, propsFleets, propsEquips } = battleState
  let {
    enemyFleet,
    enemyEscort,
    landBase,
    airForce,
    airControl,
    isBaseDefense,
    isHeavyBomberDefense,
    sortieState,
    eventId,
    eventKind,
    mapAreaId,
    result,
    battleForm,
    eFormation,
  } = battleState
  isBaseDefense = false
  let updateFleetStateFromLibBattle = !!battleRef

  switch (path) {
    case '/kcsapi/api_start2/getData':
    case '/kcsapi/api_port/port':
      battleRef = null
      ;({
        enemyFleet,
        enemyEscort,
        sortieState,
        eventId,
        eventKind,
        result,
        airForce,
      } = initBattleState)
      updateFleetStateFromLibBattle = false
      break

    case '/kcsapi/api_req_map/start':
    case '/kcsapi/api_req_map/next':
    case '/kcsapi/api_req_map/air_raid': {
      const mapBody = body as MapEventBody
      const {
        api_event_kind,
        api_event_id,
        api_destruction_battle,
        api_maparea_id,
        api_destruction_flag,
      } = mapBody
      isHeavyBomberDefense =
        api_destruction_flag === 1 || path === '/kcsapi/api_req_map/air_raid'
      sortieState = SortieState.Navigation
      eventId = api_event_id === undefined ? eventId : api_event_id
      eventKind = api_event_kind === undefined ? eventKind : api_event_kind
      mapAreaId = api_maparea_id === undefined ? mapAreaId : api_maparea_id
      ;({ enemyFleet, enemyEscort, landBase, airForce } = initBattleState)

      if (_showAirRaid && api_destruction_battle != null) {
        const destructionBattleArray = Array.isArray(api_destruction_battle)
          ? api_destruction_battle
          : [api_destruction_battle]
        destructionBattleArray.forEach((destructionBattle) => {
          const { api_air_base_attack, api_f_maxhps, api_f_nowhps } = destructionBattle
          const parsed_api_air_base_attack =
            typeof api_air_base_attack === 'string'
              ? (JSON.parse(api_air_base_attack) as NonNullable<AirRaidDestructionBattle['api_air_base_attack']>)
              : api_air_base_attack

          landBase = _(_airbase)
            .filter((squad) => squad.api_area_id === mapAreaId)
            .map(
              (squad) =>
                new ShipClass({
                  id: -1,
                  owner: ShipOwner.Ours,
                  pos: squad.api_rid,
                  maxHP: api_f_maxhps?.[squad.api_rid - 1] ?? 200,
                  nowHP: api_f_nowhps?.[squad.api_rid - 1] ?? 0,
                  items: map(squad.api_plane_info, (plane) => plane.api_slotid),
                  raw: squad as unknown as RawFleetShip,
                }),
            )
            .value()

          const {
            api_ship_ke,
            api_eSlot,
            api_e_maxhps,
            api_e_nowhps,
            api_ship_lv,
            api_lost_kind,
            api_formation,
          } = destructionBattle
          enemyFleet = initEnemy(
            0,
            api_ship_ke ?? [],
            api_eSlot ?? [],
            api_e_maxhps ?? [],
            api_e_nowhps ?? [],
            api_ship_lv ?? [],
          )
          battleForm = EngagementMap[api_formation?.[2] ?? -1] ?? ''
          eFormation = FormationMap[api_formation?.[1] ?? -1] ?? ''

          const airBaseAttack =
            typeof parsed_api_air_base_attack === 'object' && parsed_api_air_base_attack !== null
              ? parsed_api_air_base_attack
              : undefined
          const api_stage1 = airBaseAttack?.api_stage1
          const api_stage2 = airBaseAttack?.api_stage2
          const api_stage3 = airBaseAttack?.api_stage3
          airForce = getAirForceStatus([api_stage1, api_stage2, api_stage3 as never])
          airControl =
            AirControlMap[
              (api_stage1 as { api_disp_seiku?: number } | undefined)?.api_disp_seiku ?? -1
            ] ?? ''

          if (!isNil(api_stage3)) {
            const { api_fdam } = api_stage3
            landBase = map(landBase, (squad, index) => {
              const lostHP = api_fdam?.[index] ?? 0
              const nowHP = (squad?.nowHP ?? 0) - lostHP
              return squad ? { ...squad, lostHP, nowHP } : squad
            })
          } else {
            landBase = map(landBase, (squad) => (squad ? { ...squad, lostHP: 0 } : squad))
          }
          result = { rank: t(lostKind[api_lost_kind ?? 0] ?? '') }
          isBaseDefense = true
        })
      }

      const isBoss = mapBody.api_event_id === 5
      battleRef = new Battle({
        type: isBoss ? BattleType.Boss : BattleType.Normal,
        map: [],
        desc: null,
        fleet: undefined,
        packet: [],
      })
      updateFleetStateFromLibBattle = false
      break
    }

    case '/kcsapi/api_req_map/start_air_base': {
      updateFleetStateFromLibBattle = false
      break
    }

    case '/kcsapi/api_req_member/get_practice_enemyinfo': {
      const api_deckname = body.api_deckname as string
      store.dispatch(onGetPracticeInfo({ title: api_deckname }))
      updateFleetStateFromLibBattle = false
      break
    }

    case '/kcsapi/api_req_practice/battle': {
      battleRef = new Battle({
        type: BattleType.Practice,
        map: [],
        desc: null,
        fleet: undefined,
        packet: [],
      })
      updateFleetStateFromLibBattle = true
      break
    }

    default:
  }

  let newState: Partial<BattleDisplayState> = {}

  if (updateFleetStateFromLibBattle && battleRef) {
    const packet = Object.clone(body)
    packet['poi_path'] = eventDetail.path

    if (!battleRef.fleet) {
      const [_mainFleet, _escortFleet] = transformToDazzyDingClass(_fleets, _equips)
      battleRef.fleet = new Fleet({
        type: _escortFleet.length ? (_sortie.combinedFlag ?? 0) : 0,
        main: _mainFleet,
        escort: _escortFleet.length ? _escortFleet : undefined,
      })
    }
    if (!battleRef.packet) {
      battleRef.packet = []
    }
    battleRef.packet.push(packet)

    if (eventDetail.path.includes('result')) {
      const resultBody = body as BattleResultBody
      const title = resultBody.api_enemy_info?.api_deck_name
      const { sortieMapId, currentNode } = _sortie
      const spot = `${sortieMapId}-${currentNode}`
      const { fFormation, smokeType } = battleState
      store.dispatch(onBattleResult({ spot, title: title ?? '', fFormation, smokeType }))
      newState = handlePacketResult(battleRef)
      battleRef = null
    } else {
      newState = simulateBattleDisplayState(battleRef)
    }
  } else if (!isEqual(propsFleets, _fleets) || !isEqual(propsEquips, _equips)) {
    const [_mainFleet, _escortFleet] = transformToLibBattleClass(_fleets, _equips)
    newState = {
      ...newState,
      mainFleet: _mainFleet,
      escortFleet: _escortFleet,
      propsFleets: _fleets,
      propsEquips: _equips,
    }
  }

  store.dispatch(
    onPatchBattle({
      mainFleet,
      escortFleet,
      enemyFleet,
      enemyEscort,
      landBase,
      airForce,
      airControl,
      isBaseDefense,
      isHeavyBomberDefense,
      sortieState,
      mapAreaId,
      eventId,
      eventKind,
      result,
      battleForm,
      eFormation,
      ...newState,
    }),
  )
}

type FleetData = ReturnType<typeof selectFleetsEquips>

const fleetDataSelector = (state: PoiRootState): FleetData => selectFleetsEquips(state)

const fleetObserver = observer(
  fleetDataSelector,
  (_dispatch: unknown, current: FleetData | undefined, previous: FleetData | undefined) => {
    if (!current) return
    if (isEqual(current.fleets, previous?.fleets) && isEqual(current.equips, previous?.equips)) return
    const state = store.getState() as PoiRootState
    const currentBattleState = battleStateSelector(state)
    if (currentBattleState.sortieState !== SortieState.InPort) return
    if (
      isEqual(currentBattleState.propsFleets, current.fleets) &&
      isEqual(currentBattleState.propsEquips, current.equips)
    )
      return
    const [mainFleet, escortFleet] = transformToLibBattleClass(current.fleets, current.equips)
    store.dispatch(
      onPatchBattle({
        mainFleet,
        escortFleet,
        propsFleets: current.fleets,
        propsEquips: current.equips,
      }),
    )
  },
)

export const initHandler = (): void => {
  window.addEventListener('game.response', handleGameResponse)
  unsubscribeObservers = observe(store, [historyObserver, fleetObserver])

  if (window.dbg?.isEnabled()) {
    window.prophetTest = (battle) =>
      store.dispatch(onPatchBattle(simulateBattleDisplayState(battle)))
    window.baseDefenseTest = (eventDetail) =>
      handleGameResponse({ detail: eventDetail } as unknown as Event)
  }
}

export const destroyHandler = (): void => {
  window.removeEventListener('game.response', handleGameResponse)
  unsubscribeObservers?.()
  unsubscribeObservers = null
  battleRef = null
  delete window.prophetTest
  delete window.baseDefenseTest
}
