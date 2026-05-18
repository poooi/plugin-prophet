import type { APIGetMemberShip2Response } from 'kcsapi/api_get_member/ship2/response'
import type { APIMstShip, APIMstSlotitem } from 'kcsapi/api_start2/getData/response'
import type { APIGetMemberSlotItemResponse } from 'kcsapi/api_get_member/slot_item/response'
import type { Ship } from 'poi-lib-battle'

export interface ProphetBattleResult {
  rank?: string
  mvp?: [number, number]
  getShip?: number
  getItem?: number
}

export interface ProphetHistoryEntry {
  fFormation?: string
  title?: string
  smokeType?: number
}

export interface ProphetExtState {
  history?: Record<string, ProphetHistoryEntry>
  useitem?: Record<string, { api_count?: number; api_id?: number }>
}

export type ProphetFleetEntry = [APIGetMemberShip2Response, APIMstShip] | undefined
export type ProphetEquipEntry = [APIGetMemberSlotItemResponse, APIMstSlotitem, number | undefined]

export interface BattleDisplayState {
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
  propsFleets?: ProphetFleetEntry[][]
  propsEquips?: ProphetEquipEntry[][][]
}
