/**
 * Selectors for accessing prophet plugin state from the Poi Redux store.
 */
import { createSelector } from 'reselect'
import get from 'lodash/get'
import { extensionSelectorFactory } from 'views/utils/selectors'
import { PLUGIN_KEY } from './actions'
import type { PoiRootState, PluginConfig } from '../host/poi-types'

export const pluginExtSelector = extensionSelectorFactory(PLUGIN_KEY) as (
  state: PoiRootState,
) => { history?: Record<string, unknown>; useitem?: Record<number, unknown> } | undefined

export const historySelector = createSelector(pluginExtSelector, (ext: { history?: Record<string, unknown>; useitem?: Record<number, unknown> } | undefined) => ext?.history ?? {})

export const useitemSelector = createSelector(pluginExtSelector, (ext: { history?: Record<string, unknown>; useitem?: Record<number, unknown> } | undefined) => ext?.useitem ?? {})

export const pluginConfigSelector = (state: PoiRootState): PluginConfig =>
  get(state, 'config.plugin.prophet', {}) as PluginConfig

export const sortieSelector = (state: PoiRootState) => state.sortie ?? {
  combinedFlag: 0,
  escapedPos: [],
  sortieMapId: '0',
  currentNode: 0,
  sortieStatus: [],
}

export const airbaseSelector = (state: PoiRootState) =>
  (state.info?.airbase ?? []) as import('../host/poi-types').AirbaseInfo[]

export const fleetInfoSelector = (state: PoiRootState) => state.info?.fleets ?? {}

export const inEventSelector = createSelector(
  (state: PoiRootState) => state.const?.$maps,
  (maps: Record<string, unknown> | undefined) => Object.keys(maps ?? {}).some((mapId) => +mapId > 100),
)

export const themeSelector = (state: PoiRootState): string =>
  get(state, 'config.poi.appearance.theme', 'dark') as string
