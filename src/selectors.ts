import memoize from 'fast-memoize'
import { createSelector } from 'reselect'
import { get, filter } from 'lodash'
import {
  fleetShipsDataSelectorFactory,
  fleetShipsEquipDataSelectorFactory,
  fleetSelectorFactory,
} from 'views/utils/selectors'

import type { ProphetFleetEntry, ProphetEquipEntry } from './types'

export const fleetSlotCountSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [fleetSelectorFactory(fleetId)],
    (fleet: { api_ship?: number[] } | null | undefined) =>
      get(fleet, 'api_ship.length', 0),
  ),
)

export const adjustedFleetShipsDataSelectorFactory = memoize((fleetId: number) =>
  createSelector(
    [fleetShipsDataSelectorFactory(fleetId), fleetSlotCountSelectorFactory(fleetId)],
    (ships = [], count: number) =>
      ships.concat(new Array(count).fill(undefined)).slice(0, count),
  ),
)

export const computeFleetIds = (state: PoiRootState): number[] => {
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

export const selectFleetsEquips = (
  state: PoiRootState,
): { fleetIds: number[]; fleets: ProphetFleetEntry[][]; equips: ProphetEquipEntry[][][] } => {
  const fleetIds = computeFleetIds(state)
  const fleets = fleetIds.map(
    (i) => adjustedFleetShipsDataSelectorFactory(i)(state),
  ) as ProphetFleetEntry[][]
  const equips = fleetIds.map((i) =>
    (fleetShipsEquipDataSelectorFactory(i)(state) ?? []).map((e) => e ?? []),
  ) as ProphetEquipEntry[][][]
  return { fleetIds, fleets, equips }
}
