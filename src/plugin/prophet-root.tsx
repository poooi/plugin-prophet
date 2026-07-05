/**
 * Prophet root component: handles game.response events, manages battle state,
 * and renders the BattlePanel. This replaces the legacy ProphetBase class component.
 */
import React, { Component, createRef } from 'react'
import { connect } from 'react-redux'
import { observe } from 'redux-observers'
import { withTranslation, type WithTranslation } from 'react-i18next'
import get from 'lodash/get'
import filter from 'lodash/filter'
import styled from 'styled-components'
import {
  fleetShipsDataSelectorFactory,
  fleetShipsEquipDataSelectorFactory,
} from 'views/utils/selectors'
import { store } from 'views/create-store'
import { BattlePanel } from '../components/battle/battle-panel'
import { PacketController } from '../battle/packet-controller'
import { buildViewModelFromState } from '../battle/view-model-builder'
import { getAutoLayout } from '../utils/layout'
import { onBattleResult, onGetPracticeInfo, PLUGIN_KEY } from '../state/actions'
import { historyObserver, useitemObserver } from '../state/observers'
import { resolveMainPath, resolvePluginPath } from '../host/poi-assets'
import type { PoiRootState, AirbaseInfo } from '../host/poi-types'
import type { ProphetViewModel } from '../battle/battle-view-model'

const Container = styled.div`
  padding: 4px 8px;
  height: 100%;
  overflow: scroll;
`

type FleetData = Array<Array<[unknown, unknown] | undefined> | undefined>
type EquipData = Array<Array<Array<[unknown, unknown] | undefined> | undefined> | undefined>

interface ProphetRootStateProps {
  sortie: {
    combinedFlag: number
    escapedPos: number[]
    sortieMapId: string
    currentNode: number
    sortieStatus: boolean[]
    item?: Record<string, number>
  }
  fleets: FleetData
  equips: EquipData
  fleetIds: number[]
  airbase: AirbaseInfo[]
  layout: string
  showAirRaid: boolean
  $ships: Record<string, { api_name: string }>
  $slotitems: Record<string, { api_name: string; api_type: number[] }>
}

type ProphetRootProps = ProphetRootStateProps & WithTranslation

interface ProphetRootState {
  viewModel: ProphetViewModel | null
  width: number
  height: number
}

class ProphetRootInner extends Component<ProphetRootProps, ProphetRootState> {
  private _controller: PacketController
  private _unsubscribeObserver?: () => void
  private _resizeObserver?: ResizeObserver
  root = createRef<HTMLDivElement>()

  override state: ProphetRootState = {
    viewModel: null,
    width: 500,
    height: 400,
  }

  constructor(props: ProphetRootProps) {
    super(props)
    this._controller = new PacketController({
      onBattleResult: (opts) => window.dispatch(onBattleResult(opts)),
      onGetPracticeInfo: (opts) => window.dispatch(onGetPracticeInfo(opts)),
      notify: (message, opts) => window.notify(message, opts),
      getT: (key) => props.t(key),
      getShipName: (shipId) => get(props.$ships, `${shipId}.api_name`, '') as string,
      getEscapedPos: () => props.sortie.escapedPos ?? [],
      getSortieMapId: () => props.sortie.sortieMapId ?? '0',
      getCurrentNode: () => props.sortie.currentNode ?? 0,
      getSortieState: () => this._controller.getState().sortieState,
      showAirRaid: () => props.showAirRaid,
      getAirbase: () => props.airbase,
      getPluginAsset: (relative) => resolvePluginPath(relative),
      getHostAsset: (relative) => resolveMainPath(relative),
      notifyEnabled: () => window.config.get('plugin.prophet.notify.enable', true) as boolean,
      notifyAudio: () => window.config.get('plugin.prophet.notify.damagedAudio', undefined) as string | undefined,
    })
    // Initialize fleet state from props
    this._controller.initFleets(props.fleets, props.equips, props.sortie.combinedFlag)
  }

  override componentDidMount() {
    window.addEventListener('game.response', this._handleGameResponse)

    this._unsubscribeObserver = observe(store, [historyObserver, useitemObserver])

    this._resizeObserver = new window.ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        this.setState({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })

    if (this.root.current) {
      this._resizeObserver.observe(this.root.current)
    }

    if (window.dbg?.isEnabled()) {
      ;(window as unknown as Record<string, unknown>)['prophetTest'] = (
        battle: unknown,
      ) => {
        this._controller.handleGameResponse(
          '/kcsapi/api_req_sortie/battle',
          battle as Record<string, unknown>,
          this.props.fleets,
          this.props.equips,
          this.props.sortie.combinedFlag,
        )
        this._syncViewModel()
      }
    }
  }

  override componentDidUpdate(prevProps: ProphetRootProps) {
    const { fleets, equips, sortie } = this.props
    if (fleets !== prevProps.fleets || equips !== prevProps.equips) {
      this._controller.updateFleets(fleets, equips, sortie.combinedFlag)
      this._syncViewModel()
    }
    // Update deps callbacks that depend on props
    this._controller['_deps'].getT = (key: string) => this.props.t(key)
    this._controller['_deps'].getShipName = (shipId: number) =>
      get(this.props.$ships, `${shipId}.api_name`, '') as string
    this._controller['_deps'].getEscapedPos = () => this.props.sortie.escapedPos ?? []
    this._controller['_deps'].getSortieMapId = () => this.props.sortie.sortieMapId ?? '0'
    this._controller['_deps'].getCurrentNode = () => this.props.sortie.currentNode ?? 0
    this._controller['_deps'].showAirRaid = () => this.props.showAirRaid
    this._controller['_deps'].getAirbase = () => this.props.airbase
  }

  override componentWillUnmount() {
    window.removeEventListener('game.response', this._handleGameResponse)
    this._unsubscribeObserver?.()
    if (this.root.current && this._resizeObserver) {
      this._resizeObserver.unobserve(this.root.current)
    }
    delete (window as unknown as Record<string, unknown>)['prophetTest']
    delete (window as unknown as Record<string, unknown>)['baseDefenseTest']
  }

  private _handleGameResponse = (e: Event) => {
    const { detail } = e as CustomEvent<{ path: string; body: Record<string, unknown> }>
    const { path, body } = detail
    const { fleets, equips, sortie } = this.props

    this._controller.handleGameResponse(path, body, fleets, equips, sortie.combinedFlag)
    this._syncViewModel()
  }

  private _syncViewModel() {
    const state = this._controller.getState()
    const { $ships, $slotitems, sortie } = this.props
    const viewModel = buildViewModelFromState(state, $ships, $slotitems, sortie)
    this.setState({ viewModel })
  }

  private _buildAirBaseSquads() {
    const { airbase, $slotitems } = this.props
    return (airbase ?? [])
      .filter((base) => base.api_squadron_id && (base.api_plane_info?.length ?? 0) > 0)
      .map((base) => ({
        id: base.api_squadron_id as number,
        planes: base.api_plane_info
          .filter((p) => p.api_state > 0)
          .map((p) => {
            const $item = $slotitems?.[p.api_slotid]
            return {
              count: p.api_count,
              max: p.api_max_count,
              now: p.api_count,
              name: $item?.api_name ?? '',
              iconId: $item?.api_type?.[3] ?? 0,
            }
          }),
      }))
  }

  override render() {
    const { viewModel, width, height } = this.state
    const { layout } = this.props
    const finalLayout = layout === 'auto' ? getAutoLayout(width, height) : layout
    const airBaseSquads = this._buildAirBaseSquads()

    return (
      <Container id={PLUGIN_KEY} ref={this.root} data-layout={finalLayout}>
        <BattlePanel
          viewModel={viewModel}
          airBaseSquads={airBaseSquads}
        />
      </Container>
    )
  }
}

const mapStateToProps = (state: PoiRootState): ProphetRootStateProps => {
  const sortie = state.sortie ?? {
    combinedFlag: 0,
    escapedPos: [],
    sortieMapId: '0',
    currentNode: 0,
    sortieStatus: [],
  }
  const sortieStatus = sortie.sortieStatus ?? []
  const airbase = (state.info?.airbase ?? []) as AirbaseInfo[]

  const fleetIds: number[] = []
  if (sortieStatus.some(Boolean)) {
    sortieStatus.forEach((a, i) => {
      if (a) fleetIds.push(i)
    })
  } else if (sortie.combinedFlag) {
    fleetIds.push(0, 1)
  } else if (filter(get(state, 'info.fleets.2.api_ship'), (id) => (id as number) > 0).length === 7) {
    // 17 autumn event 7-ship fleet
    fleetIds.push(2)
  } else {
    fleetIds.push(0)
  }

  const fleets = fleetIds.map((i) => fleetShipsDataSelectorFactory(i)(state as never))
  const equips = fleetIds.map((i) => fleetShipsEquipDataSelectorFactory(i)(state as never))

  return {
    sortie: {
      combinedFlag: sortie.combinedFlag ?? 0,
      escapedPos: sortie.escapedPos ?? [],
      sortieMapId: sortie.sortieMapId ?? '0',
      currentNode: sortie.currentNode ?? 0,
      sortieStatus: sortieStatus as boolean[],
      item: sortie.item,
    },
    fleets: fleets as FleetData,
    equips: equips as EquipData,
    fleetIds,
    airbase,
    layout: get(state, 'config.plugin.prophet.layout', 'auto') as string,
    showAirRaid: get(state, 'config.plugin.prophet.showAirRaid', true) as boolean,
    $ships: get(state, 'const.$ships', {}) as Record<string, { api_name: string }>,
    $slotitems: get(state, 'const.$slotitems', {}) as Record<string, { api_name: string; api_type: number[] }>,
  }
}

const ConnectedProphetRoot = connect(mapStateToProps)(ProphetRootInner)
export const ProphetRoot = withTranslation([PLUGIN_KEY, 'resources'])(ConnectedProphetRoot) as React.ComponentType
