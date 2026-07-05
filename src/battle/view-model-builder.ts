/**
 * Converts PacketController's BattleStateSnapshot into ProphetViewModel for the UI.
 */
import type { BattleStateSnapshot } from './packet-controller'
import type {
  ProphetViewModel,
  FleetGroupViewModel,
  FleetViewModel,
  ShipViewModel,
  BattleSummaryViewModel,
  NextSpotViewModel,
  DropViewModel,
} from './battle-view-model'
import { SortieState } from './battle-view-model'
import { ShipOwner } from './lib-battle-adapter'
import type { Ship } from './lib-battle-adapter'

type ShipRecord = Record<string, unknown>

interface SortieInfo {
  combinedFlag?: number
  sortieMapId?: string
  currentNode?: number
  sortieStatus?: boolean[]
}

function toShipViewModel(
  ship: Ship | null,
  idx: number,
  $ships: Record<string, ShipRecord>,
  $slotitems: Record<string, ShipRecord>,
  isEnemy: boolean,
  isMvp: boolean = false,
): ShipViewModel {
  if (!ship) {
    return {
      key: `empty-${idx}`,
      id: -1,
      owner: isEnemy ? 'Enemy' : 'Ours',
      name: '',
      yomi: '',
      level: null,
      position: idx,
      hp: { max: 0, now: 0, init: 0, lost: 0, stage: null },
      damage: 0,
      isMvp: false,
      isEscaped: false,
      useItemId: null,
      params: null,
      slots: [],
      extra: null,
      avatar: null,
      condStyle: '',
      cond: undefined,
    }
  }

  const raw = ship.raw as ShipRecord
  const apiShipId = (raw['api_ship_id'] as number | undefined) ?? ship.id
  const $ship = $ships[String(apiShipId)] ?? {}

  const name = ($ship['api_name'] as string | undefined) ?? ''
  const yomi = ($ship['api_yomi'] as string | undefined) ?? ''
  const level = (raw['api_lv'] as number | undefined) ?? null

  // Build slots
  const poiSlot = (raw['poi_slot'] as ShipRecord[] | undefined) ?? []
  const poiSlotEx = raw['poi_slot_ex'] as ShipRecord | null | undefined
  const slots: ShipViewModel['slots'] = poiSlot
    .filter((s): s is ShipRecord => s != null)
    .map((s, slotIdx) => {
      const itemId = (s['api_slotitem_id'] as number | undefined) ?? 0
      const $item = $slotitems[String(itemId)] ?? {}
      return {
        id: itemId,
        typeId: ($item['api_type'] as number[] | undefined)?.[2] ?? 0,
        name: ($item['api_name'] as string | undefined) ?? '',
        level: (s['api_level'] as number | undefined) ?? 0,
        alv: (s['api_alv'] as number | undefined) ?? 0,
        onslot: (raw['api_onslot'] as number[] | undefined)?.[slotIdx] ?? 0,
        maxslot: ($ship['api_maxeq'] as number[] | undefined)?.[slotIdx] ?? 0,
        isExtra: false,
      }
    })

  const extra: ShipViewModel['extra'] = poiSlotEx
    ? (() => {
        const itemId = (poiSlotEx['api_slotitem_id'] as number | undefined) ?? 0
        const $item = $slotitems[String(itemId)] ?? {}
        return {
          id: itemId,
          typeId: ($item['api_type'] as number[] | undefined)?.[2] ?? 0,
          name: ($item['api_name'] as string | undefined) ?? '',
          level: (poiSlotEx['api_level'] as number | undefined) ?? 0,
          alv: 0,
          onslot: 0,
          maxslot: 0,
          isExtra: true,
        }
      })()
    : null

  const nowHp = ship.nowHP ?? 0
  const maxHp = ship.maxHP ?? 1
  const initHp = ship.initHP ?? nowHp

  return {
    key: `${isEnemy ? 'e' : 'f'}-${ship.pos ?? idx}`,
    id: apiShipId,
    owner: ship.owner === ShipOwner.Enemy ? 'Enemy' : 'Ours',
    name,
    yomi,
    level,
    position: ship.pos ?? idx + 1,
    hp: {
      max: maxHp,
      now: nowHp,
      init: initHp,
      lost: initHp - nowHp,
      stage: null,
    },
    damage: ship.lostHP ?? 0,
    isMvp,
    isEscaped: false,
    useItemId: ship.useItem ?? null,
    params: null, // Ship parameters not available in lib-battle v3
    slots,
    extra,
    avatar: null,
    condStyle: '',
    cond: (raw['api_cond'] as number | undefined),
  }
}

function toFleetViewModel(
  ships: Array<Ship | null>,
  $ships: Record<string, ShipRecord>,
  $slotitems: Record<string, ShipRecord>,
  isEnemy: boolean,
  mvpIdx: number = -1,
): FleetViewModel {
  return {
    ships: ships.map((ship, idx) => toShipViewModel(ship, idx, $ships, $slotitems, isEnemy, idx === mvpIdx)),
  }
}

export function buildViewModelFromState(
  state: BattleStateSnapshot,
  $ships: Record<string, ShipRecord>,
  $slotitems: Record<string, ShipRecord>,
  _sortie: SortieInfo,
): ProphetViewModel {
  const {
    mainFleet,
    escortFleet,
    enemyFleet,
    enemyEscort,
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
    fFormation,
    smokeType,
    mvpPos,
  } = state

  const [mainMvpIdx, escortMvpIdx] = mvpPos ?? [-1, -1]

  const alliedMain = mainFleet.length > 0
    ? toFleetViewModel(mainFleet, $ships, $slotitems, false, mainMvpIdx)
    : null
  const alliedEscort = escortFleet.length > 0
    ? toFleetViewModel(escortFleet, $ships, $slotitems, false, escortMvpIdx)
    : null
  const enemyMain = enemyFleet.length > 0
    ? toFleetViewModel(enemyFleet, $ships, $slotitems, true)
    : null
  const enemyEscortVM = enemyEscort.length > 0
    ? toFleetViewModel(enemyEscort, $ships, $slotitems, true)
    : null

  const [fInit, fLost, eInit, eLost] = airForce
  const hasAirForce = fInit > 0 || eInit > 0

  const alliedGroup: FleetGroupViewModel = {
    title: '',
    main: alliedMain,
    escort: alliedEscort,
    airForce: hasAirForce ? { fInit, fLost, eInit, eLost } : null,
    transport: null,
    isBaseDefense,
  }

  const enemyGroup: FleetGroupViewModel = {
    title: '',
    main: enemyMain,
    escort: enemyEscortVM,
    airForce: null,
    transport: null,
    isBaseDefense,
  }

  const summary: BattleSummaryViewModel = {
    rank: result.rank ?? '',
    battleForm,
    eFormation,
    fFormation,
    airControl,
    smokeType,
  }

  const map: NextSpotViewModel | null =
    sortieState === SortieState.Navigation || sortieState === SortieState.Battle
      ? {
          eventId,
          eventKind,
          isHeavyBomberDefense,
          isBaseDefense,
          fFormation: fFormation || null,
          smokeType,
        }
      : null

  const drop: DropViewModel | null =
    (sortieState === SortieState.Battle || sortieState === SortieState.Practice) &&
    result &&
    (result.getShip != null || result.getItem != null)
      ? { shipId: result.getShip ?? null, itemId: result.getItem ?? null }
      : null

  return {
    layout: 'vertical',
    sortieState,
    allied: alliedGroup,
    enemy: enemyGroup,
    summary,
    map,
    drop,
  }
}
