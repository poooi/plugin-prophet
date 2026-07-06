import type { APIMstShip } from 'kcsapi/api_start2/getData/response'

export type FriendShipRaw = APIMstShip & {
  api_ship_id?: number
  api_lv?: number
  api_cond?: number
  api_maxeq?: number[]
  api_onslot?: number[]
  api_id?: number
  api_nowhp?: number
  api_maxhp?: number
  api_fuel?: number
  api_fuel_max?: number
  api_bull?: number
  api_bull_max?: number
  poi_slot?: (ApiSlotItemLike | null)[]
  poi_slot_ex?: ApiSlotItemLike | null
}
