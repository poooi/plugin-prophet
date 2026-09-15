import type { Ship } from 'poi-lib-battle'
import type { FriendShipRaw } from '../views/ship-view/types'
import type { TransportShip } from './transport'

/** Equipment master fields have already been merged by lib-battle-adapter. */
export const toTransportFleets = (
  fleets: readonly (readonly (Ship | null | undefined)[])[],
  escapedShipIds: readonly number[] = [],
): TransportShip[][] => fleets.map((fleet) => fleet
  .filter((ship): ship is Ship => ship != null)
  .map((ship) => {
    const raw = ship.raw as FriendShipRaw
    return {
      shipId: raw.api_ship_id ?? -1,
      shipType: raw.api_stype,
      eligible: !escapedShipIds.includes(raw.api_id ?? -1) &&
        (raw.api_nowhp ?? 0) * 4 > (raw.api_maxhp ?? 0),
      items: [...(raw.poi_slot ?? []), raw.poi_slot_ex]
        .filter((item) => item != null)
        .map((item) => ({
          itemId: item.api_slotitem_id ?? -1,
          category: item.api_type?.[2] ?? -1,
        })),
    }
  }),
)
