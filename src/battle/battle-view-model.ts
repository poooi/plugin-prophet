/**
 * View model types for the Prophet UI.
 * These are pure data types with no React or Redux dependencies.
 */

export const SortieState = {
  InPort: 0,
  Navigation: 1,
  Battle: 2,
  Practice: 3,
} as const

export type SortieState = (typeof SortieState)[keyof typeof SortieState]

export interface ProphetViewModel {
  layout: 'horizontal' | 'vertical'
  sortieState: SortieState
  allied: FleetGroupViewModel
  enemy: FleetGroupViewModel
  summary: BattleSummaryViewModel
  map: NextSpotViewModel | null
  drop: DropViewModel | null
}

export interface FleetGroupViewModel {
  title: string
  main: FleetViewModel | null
  escort: FleetViewModel | null
  airForce: AirForceViewModel | null
  transport: TransportPointViewModel | null
  isBaseDefense: boolean
}

export interface FleetViewModel {
  ships: ShipViewModel[]
}

export interface ShipViewModel {
  key: string
  id: number
  owner: 'Ours' | 'Enemy' | 'Friend' | 'Support'
  name: string
  yomi: string
  level: number | null
  position: number
  hp: HpViewModel
  damage: number
  isMvp: boolean
  isEscaped: boolean
  useItemId: number | null
  params: ShipParameterViewModel | null
  slots: SlotItemViewModel[]
  extra: SlotItemViewModel | null
  avatar: AvatarViewModel | null
  condStyle: string
  cond: number | undefined
}

export interface HpViewModel {
  max: number
  now: number
  init: number
  lost: number
  stage: number | null
}

export interface ShipParameterViewModel {
  firepower: number
  torpedo: number
  aa: number
  armor: number
  isFinal: boolean
}

export interface SlotItemViewModel {
  id: number
  typeId: number
  name: string
  level: number
  alv: number
  onslot: number
  maxslot: number
  isExtra: boolean
}

export interface AvatarViewModel {
  mstId: number
  isDamaged: boolean
}

export interface AirForceViewModel {
  fInit: number
  fLost: number
  eInit: number
  eLost: number
}

export interface TransportPointViewModel {
  total: number
  actual: number
}

export interface BattleSummaryViewModel {
  rank: string
  battleForm: string
  eFormation: string
  fFormation: string
  airControl: string
  smokeType: number
}

export interface NextSpotViewModel {
  eventId: number
  eventKind: number
  isHeavyBomberDefense: boolean
  isBaseDefense: boolean
  fFormation: string | null
  smokeType: number
}

export interface DropViewModel {
  shipId: number | null
  itemId: number | null
}
