import React, { FC, useRef, useState, useEffect, useCallback } from 'react'
import _, { isEqual, isNil, each, map, isEmpty, includes, concat, get, filter, first } from 'lodash'
import { useSelector, useDispatch } from 'react-redux'
import { observe } from 'redux-observers'
import memoize from 'fast-memoize'
import { createSelector } from 'reselect'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  fleetShipsDataSelectorFactory,
  fleetShipsEquipDataSelectorFactory,
  fleetSelectorFactory,
} from 'views/utils/selectors'
import { store } from 'views/create-store'

import BattleViewArea from './views/battle-view-area'
import {
  PLUGIN_KEY,
  initEnemy,
  lostKind,
  getAutoLayout,
  transformToLibBattleClass,
  synthesizeInfo,
  getAirForceStatus,
  transformToDazzyDingClass,
  SortieState,
  resolveMainPath,
} from './utils'
import { Models, Simulator, Battle, Fleet } from 'poi-lib-battle'
import type { Ship, Result, RawFleetShip } from 'poi-lib-battle'
import {
  onBattleResult,
  onGetPracticeInfo,
  historyObserver,
  useitemObserver,
} from './redux'
import type { ProphetBattleResult } from './types'

const {
  Ship: ShipClass,
  ShipOwner,
  BattleType,
  FormationMap,
  EngagementMap,
  AirControlMap,
} = Models

const { getStore, dispatch: poiDispatch } = window
// poiDispatch is declared but kept for future use
void poiDispatch

const Container = styled.div`
  padding: 4px 8px;
  height: 100%;
  overflow: scroll;
`

const fleetSlotCountSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [fleetSelectorFactory(fleetId)],
    (fleet: { api_ship?: number[] } | null | undefined) =>
      get(fleet, 'api_ship.length', 0),
  ),
)

const adjustedFleetShipsDataSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [fleetShipsDataSelectorFactory(fleetId), fleetSlotCountSelectorFactory(fleetId)],
    (ships: unknown[] = [], count: number) =>
      ships.concat(new Array(count).fill(undefined)).slice(0, count),
  ),
)

interface ProphetState {
  mainFleet: (Ship | null)[]
  escortFleet: (Ship | null)[]
  enemyFleet: (Ship | null)[] | null
  enemyEscort: (Ship | null)[] | null
  landBase: (Ship | null)[]
  airForce: number[]
  airControl: string
  isBaseDefense: boolean
  isHeavyBomberDefense: boolean
  sortieState: number
  mapAreaId: number
  eventId: number
  eventKind: number
  result: ProphetBattleResult
  battleForm: string
  smokeType: number
  eFormation: string
  fFormation: string
  width: number
  height: number
  propsFleets?: unknown[][]
  propsEquips?: unknown[][][]
}

const initState: ProphetState = {
  mainFleet: [],
  escortFleet: [],
  enemyFleet: null,
  enemyEscort: null,
  landBase: [],
  airForce: [0, 0, 0, 0],
  airControl: '',
  isBaseDefense: false,
  isHeavyBomberDefense: false,
  sortieState: SortieState.InPort,
  mapAreaId: 0,
  eventId: 0,
  eventKind: 0,
  result: {},
  battleForm: '',
  smokeType: 0,
  eFormation: '',
  fFormation: '',
  width: 500,
  height: 400,
}

const computeFleetIds = (state: PoiRootState): number[] => {
  const sortie = state.sortie
  const sortieStatus = sortie.sortieStatus ?? []
  const fleetIds: number[] = []
  if (sortieStatus.length && sortieStatus.reduce((a, b) => a || b)) {
    sortieStatus.forEach((a, i) => { if (a) fleetIds.push(i) })
  } else if (sortie.combinedFlag) {
    fleetIds.push(0, 1)
  } else if (filter(state.info?.fleets?.[2]?.api_ship, (id) => id > 0).length === 7) {
    fleetIds.push(2)
  } else {
    fleetIds.push(0)
  }
  return fleetIds
}

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

interface PracticeEnemyInfoBody {
  api_deckname: string
}

interface BattleResultBody {
  api_enemy_info?: { api_deck_name?: string }
}

export const Prophet: FC = () => {
  const { t } = useTranslation([PLUGIN_KEY, 'resources'])
  const dispatch = useDispatch()

  const sortie = useSelector((state: PoiRootState) => state.sortie)
  const airbase = useSelector((state: PoiRootState) => state.info?.airbase ?? [])
  const fleetIds = useSelector(computeFleetIds)
  const fleets = useSelector((state: PoiRootState) =>
    fleetIds.map((i) => adjustedFleetShipsDataSelectorFactory(i)(state as object)),
  )
  const equips = useSelector((state: PoiRootState) =>
    fleetIds.map((i) => fleetShipsEquipDataSelectorFactory(i)(state as object)),
  )
  const layout = useSelector((state: PoiRootState) =>
    state.config?.plugin?.prophet?.layout ?? 'auto',
  )
  const showAirRaid = useSelector((state: PoiRootState) =>
    state.config?.plugin?.prophet?.showAirRaid ?? true,
  )

  const [state, setState] = useState<ProphetState>(() => {
    const [mainFleet, escortFleet] = transformToLibBattleClass(fleets, equips)
    return { ...initState, mainFleet, escortFleet }
  })

  const rootRef = useRef<HTMLDivElement>(null)
  const battleRef = useRef<Battle | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state

  const propsRef = useRef({ t, fleets, equips, sortie, showAirRaid, airbase, dispatch })
  propsRef.current = { t, fleets, equips, sortie, showAirRaid, airbase, dispatch }

  const handlePacket = useCallback((battle: Battle): Partial<ProphetState> => {
    const sortieState =
      battle.type === BattleType.Practice
        ? SortieState.Practice
        : SortieState.Battle
    const simulator = new Simulator(battle.fleet!, { usePoiAPI: true })
    const packets = battle.packet ?? []
    const firstPacket = packets[0] as { api_f_nowhps?: number[]; api_f_maxhps?: number[] } | undefined
    const nowHP = first(firstPacket?.api_f_nowhps)
    if (simulator.mainFleet?.[0] && simulator.mainFleet[0].nowHP !== nowHP && typeof nowHP !== 'undefined') {
      const maxHP = first(firstPacket?.api_f_maxhps)
      const s = simulator.mainFleet[0]
      s.useItem = maxHP === nowHP ? 43 : 42
      s.initHP = nowHP
      s.nowHP = nowHP
    }
    packets.forEach((packet) => simulator.simulate(packet))
    const { result } = simulator

    const newState = synthesizeInfo(simulator, result, packets)
    return { ...newState, sortieState, result }
  }, [])

  const handlePacketResult = useCallback(
    (battle: Battle): Partial<ProphetState> => {
      const { t: _t, sortie: _sortie } = propsRef.current
      const { sortieState, mainFleet, escortFleet } = stateRef.current
      const newState = handlePacket(battle)
      const escapedPos = _sortie.escapedPos ?? []
      const friendShips = concat(mainFleet, escortFleet)
      const damageList: string[] = []

      each(friendShips, (ship) => {
        if (ship == null) return
        if (
          ship.nowHP / ship.maxHP <= 0.25 &&
          !includes(escapedPos, ship.pos - 1) &&
          sortieState !== SortieState.Practice
        ) {
          const shipName = getStore<string>(`const.$ships.${ship.raw && (ship.raw as { api_ship_id?: number }).api_ship_id}.api_name`, ' ')
          damageList.push(_t(shipName))
        }
      })

      if (!isEmpty(damageList) && config.get('plugin.prophet.notify.enable', true)) {
        window.notify(`${damageList.join(', ')} ${_t('Heavily damaged')}`, {
          type: 'damaged',
          icon: resolveMainPath('./views/components/main/assets/img/state/4.png'),
          audio: config.get('plugin.prophet.notify.damagedAudio'),
        })
      }
      return { ...newState }
    },
    [handlePacket],
  )

  const handleGameResponse = useCallback(
    (e: Event) => {
      const { t: _t, fleets: _fleets, equips: _equips, sortie: _sortie, showAirRaid: _showAirRaid, airbase: _airbase, dispatch: _dispatch } = propsRef.current
      const eventDetail = (e as CustomEvent<{ path: string; body: Record<string, unknown> }>).detail
      const { path } = eventDetail
      const body = eventDetail.body

      const { mainFleet, escortFleet, propsFleets, propsEquips } = stateRef.current
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
      } = stateRef.current
      isBaseDefense = false
      let updateFleetStateFromLibBattle = !!battleRef.current

      switch (path) {
        case '/kcsapi/api_start2/getData':
        case '/kcsapi/api_port/port':
          battleRef.current = null
          ;({
            enemyFleet,
            enemyEscort,
            sortieState,
            eventId,
            eventKind,
            result,
            airForce,
          } = initState)
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
          ;({ enemyFleet, enemyEscort, landBase, airForce } = initState)

          if (_showAirRaid && api_destruction_battle != null) {
            const destructionBattleArray = Array.isArray(api_destruction_battle)
              ? api_destruction_battle
              : [api_destruction_battle]
            destructionBattleArray.forEach((destructionBattle) => {
              const {
                api_air_base_attack,
                api_f_maxhps,
                api_f_nowhps,
              } = destructionBattle
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

              const airBaseAttack = typeof parsed_api_air_base_attack === 'object' && parsed_api_air_base_attack !== null
                ? parsed_api_air_base_attack : undefined
              const api_stage1 = airBaseAttack?.api_stage1
              const api_stage2 = airBaseAttack?.api_stage2
              const api_stage3 = airBaseAttack?.api_stage3
              airForce = getAirForceStatus([api_stage1, api_stage2, api_stage3 as never])
              airControl = AirControlMap[(api_stage1 as { api_disp_seiku?: number } | undefined)?.api_disp_seiku ?? -1] ?? ''

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
              result = { rank: _t(lostKind[api_lost_kind ?? 0] ?? '') }
              isBaseDefense = true
            })
          }

          const isBoss = mapBody.api_event_id === 5
          battleRef.current = new Battle({
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
          const { api_deckname } = body as unknown as PracticeEnemyInfoBody
          _dispatch(onGetPracticeInfo({ title: api_deckname }))
          updateFleetStateFromLibBattle = false
          break
        }

        case '/kcsapi/api_req_practice/battle': {
          battleRef.current = new Battle({
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

      let newState: Partial<ProphetState> = {}

      if (updateFleetStateFromLibBattle && battleRef.current) {
        const packet = Object.clone(body)
        packet['poi_path'] = eventDetail.path

        if (!battleRef.current.fleet) {
          const [_mainFleet, _escortFleet] = transformToDazzyDingClass(_fleets, _equips)
          battleRef.current.fleet = new Fleet({
            type: _escortFleet.length ? (_sortie.combinedFlag ?? 0) : 0,
            main: _mainFleet,
            escort: _escortFleet.length ? _escortFleet : undefined,
          })
        }
        if (!battleRef.current.packet) {
          battleRef.current.packet = []
        }
        battleRef.current.packet.push(packet)

        if (eventDetail.path.includes('result')) {
          const resultBody = body as BattleResultBody
          const title = resultBody.api_enemy_info?.api_deck_name
          const { sortieMapId, currentNode } = _sortie
          const spot = `${sortieMapId}-${currentNode}`
          const { fFormation, smokeType } = stateRef.current
          _dispatch(onBattleResult({ spot, title: title ?? '', fFormation, smokeType }))
          newState = handlePacketResult(battleRef.current)
          battleRef.current = null
        } else {
          newState = handlePacket(battleRef.current)
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

      setState((prev) => ({
        ...prev,
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
      }))
    },
    [handlePacket, handlePacketResult],
  )

  useEffect(() => {
    window.addEventListener('game.response', handleGameResponse)
    unsubscribeRef.current = observe(store, [historyObserver, useitemObserver])

    const resizeObserver = new window.ResizeObserver(([{ contentRect }]: ResizeObserverEntry[]) => {
      const { width, height } = contentRect
      setState((prev) => ({ ...prev, width, height }))
    })

    if (rootRef.current) {
      resizeObserver.observe(rootRef.current)
    }

    if (window.dbg?.isEnabled()) {
      window.prophetTest = (battle) =>
        setState((prev) => ({ ...prev, ...handlePacket(battle) }))
      window.baseDefenseTest = (eventDetail) =>
        handleGameResponse({ detail: eventDetail } as unknown as Event)
    }

    return () => {
      window.removeEventListener('game.response', handleGameResponse)
      unsubscribeRef.current?.()
      if (rootRef.current) {
        resizeObserver.unobserve(rootRef.current)
      }
      delete window.prophetTest
      delete window.baseDefenseTest
    }
  }, [handleGameResponse, handlePacket])

  useEffect(() => {
    const [mainFleet, escortFleet] = transformToLibBattleClass(fleets, equips)
    setState((prev) => ({ ...prev, mainFleet, escortFleet, propsFleets: fleets, propsEquips: equips }))
  }, [fleets, equips])

  const {
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
    eventId,
    eventKind,
    result,
    battleForm,
    eFormation,
    width,
    height,
    smokeType,
  } = state

  const finalLayout = layout === 'auto' ? getAutoLayout(width, height) : layout

  return (
    <Container id="plugin-prophet" ref={rootRef}>
      <BattleViewArea
        mainFleet={mainFleet}
        escortFleet={escortFleet}
        enemyFleet={enemyFleet ?? undefined}
        enemyEscort={enemyEscort ?? undefined}
        landBase={landBase}
        airForce={airForce}
        airControl={airControl}
        isBaseDefense={isBaseDefense}
        isHeavyBomberDefense={isHeavyBomberDefense}
        sortieState={sortieState}
        eventId={eventId}
        eventKind={eventKind}
        result={result}
        battleForm={battleForm}
        eFormation={eFormation}
        fleetIds={fleetIds}
        horizontalLayout={finalLayout === 'horizontal'}
        root={rootRef.current}
        smokeType={smokeType}
      />
    </Container>
  )
}
