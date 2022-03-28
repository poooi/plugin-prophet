import React, { Component } from 'react'
import PropTypes, { number } from 'prop-types'
import _, {
  isEqual,
  isNil,
  each,
  map,
  isEmpty,
  includes,
  concat,
  get,
  filter,
  first,
} from 'lodash'
import { connect } from 'react-redux'
import { observe } from 'redux-observers'
import memoize from 'fast-memoize'
import { createSelector } from 'reselect'
import { withNamespaces } from 'react-i18next'
import styled from 'styled-components'
import { compose } from 'redux'

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
import { Models, Simulator } from '../lib/battle'
import {
  onBattleResult,
  onGetPracticeInfo,
  historyObserver,
  useitemObserver,
} from './redux'

const {
  Ship,
  ShipOwner,
  Battle,
  BattleType,
  Fleet,
  FormationMap,
  EngagementMap,
  AirControlMap,
} = Models

const { getStore, dispatch } = window
// const { fleetShipsDataSelectorFactory } = require(`${ROOT}/views/utils/selectors`)

// const __ = i18next.getFixedT(null, [PLUGIN_KEY, 'resources'])

const Container = styled.div`
  padding: 4px 8px;
  height: 100%;
  overflow: scroll;
`

/* selector */
const fleetSlotCountSelectorFactory = memoize(fleetId =>
  createSelector(
    [fleetSelectorFactory(fleetId)],
    fleet => get(fleet, 'api_ship.length', 0),
  ),
)

const adjustedFleetShipsDataSelectorFactory = memoize(fleetId =>
  createSelector(
    [
      fleetShipsDataSelectorFactory(fleetId),
      fleetSlotCountSelectorFactory(fleetId),
    ],
    (ships = [], count) =>
      ships.concat(new Array(count).fill(undefined)).slice(0, count),
  ),
)

class ProphetBase extends Component {
  static initState = {
    mainFleet: [], // An array of fleet
    escortFleet: [],
    enemyFleet: [],
    enemyEscort: [],
    landBase: [],
    airForce: [0, 0, 0, 0], // [fPlaneInit, fLost, ePlaneInit, eLost]
    airControl: '', // 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
    isBaseDefense: false,
    isHeavyBomberDefense: false,
    sortieState: SortieState.InPort, // 0: port, 1: before battle, 2: battle, 3: practice
    mapAreaId: 0,
    eventId: 0,
    eventKind: 0,
    result: {},
    battleForm: '', // api_formation[2]
    eFormation: '', // enemy formation, api_formation[1]
    fFormation: '',
    width: 500,
    height: 400,
    top: 30,
    bottom: 0,
    left: 800,
    right: 0,
  }

  static propTypes = {
    sortie: PropTypes.shape({
      combinedFlag: PropTypes.number,
      escapedPos: PropTypes.arrayOf(number),
      sortieMapId: PropTypes.string,
      currentNode: PropTypes.number,
    }),
    fleets: PropTypes.arrayOf(PropTypes.array),
    equips: PropTypes.arrayOf(PropTypes.array),
    airbase: PropTypes.arrayOf(PropTypes.object),
    fleetIds: PropTypes.arrayOf(PropTypes.number),
    t: PropTypes.func.isRequired,
    layout: PropTypes.string.isRequired,
  }

  root = React.createRef()

  constructor(props) {
    super(props)
    const [mainFleet, escortFleet] = transformToLibBattleClass(
      props.fleets,
      props.equips,
    )
    this.state = {
      ...this.constructor.initState,
      mainFleet,
      escortFleet,
    }
  }

  async componentDidMount() {
    // initialize repsonse listener
    window.addEventListener('game.response', this.handleGameResponse)

    this.unsubscribeObserver = observe(store, [
      historyObserver,
      useitemObserver,
    ])

    this.resizeObserver = new window.ResizeObserver(([{ contentRect }]) => {
      const { width, height } = contentRect
      this.setState({
        width,
        height,
      })
    })

    this.resizeObserver.observe(this.root.current)

    // for debug (ugly)
    if (window.dbg.isEnabled()) {
      window.prophetTest = battle => this.setState(this.handlePacket(battle))
      window.baseDefenseTest = e => this.handleGameResponse({ detail: e })
    }
  }

  componentWillUnmount() {
    window.removeEventListener('game.response', this.handleGameResponse)

    if (this.unsubscribeObserver) {
      this.unsubscribeObserver()
    }

    this.resizeObserver.unobserve(this.root.current)

    delete window.prophetTest
    delete window.baseDefenseTest
  }

  handlePacket = battle => {
    const sortieState =
      battle.type === (BattleType.Practice || BattleType.Pratice)
        ? SortieState.Practice
        : SortieState.Battle
    // console.log(battle)
    const simulator = new Simulator(battle.fleet, { usePoiAPI: true })
    // correct main fleet flagship HP for possible repair usage
    const { api_f_nowhps, api_f_maxhps } = battle.packet[0]
    const nowHP = first(api_f_nowhps)
    if (
      simulator.mainFleet[0].nowHP !== nowHP &&
      typeof nowHP !== 'undefined'
    ) {
      const maxHP = first(api_f_maxhps)
      // 42=応急修理要員, 43=応急修理女神
      simulator.mainFleet[0].useItem = maxHP === nowHP ? 43 : 42
      simulator.mainFleet[0].initHP = nowHP
      simulator.mainFleet[0].nowHP = nowHP
    }
    each(battle.packet, packet => simulator.simulate(packet))
    const { result } = simulator

    // Attention, aynthesizeStage will break object prototype, put it to last
    const newState = synthesizeInfo(simulator, result, battle.packet)
    return {
      ...newState,
      sortieState,
      result,
    }
  }

  handlePacketResult = battle => {
    const { t, sortie } = this.props
    const { sortieState } = this.state
    const newState = this.handlePacket(battle)
    // notify heavily damaged
    // as battle result does not touch hps, it is safe to notify here?
    const { mainFleet, escortFleet } = this.state
    const escapedPos = sortie.escapedPos || []
    const friendShips = concat(mainFleet, escortFleet)
    const damageList = []

    each(friendShips, ship => {
      if (ship == null) return
      if (
        ship.nowHP / ship.maxHP <= 0.25 &&
        !includes(escapedPos, ship.pos - 1) &&
        sortieState !== SortieState.Practice
      ) {
        const shipName = getStore(
          `const.$ships.${ship.raw.api_ship_id}.api_name`,
          ' ',
        )
        damageList.push(t(shipName))
      }
    })

    if (
      !isEmpty(damageList) &&
      config.get('plugin.prophet.notify.enable', true)
    ) {
      window.notify(`${damageList.join(', ')} ${t('Heavily damaged')}`, {
        type: 'damaged',
        icon: resolveMainPath('./views/components/main/assets/img/state/4.png'),
        audio: config.get('plugin.prophet.notify.damagedAudio'),
      })
    }
    return {
      ...newState,
    }
  }

  handleGameResponse = e => {
    const { t, fleets, equips, sortie } = this.props
    const { path, body } = e.detail
    // used in determining next spot type

    const { mainFleet, escortFleet, propsFleets, propsEquips } = this.state

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
    } = this.state
    isBaseDefense = false
    let updateFleetStateFromLibBattle = !!this.battle
    switch (path) {
      case '/kcsapi/api_start2/getData': // refresh game page
      case '/kcsapi/api_port/port':
        this.battle = null
        ;({
          enemyFleet,
          enemyEscort,
          sortieState,
          eventId,
          eventKind,
          result,
          airForce,
        } = this.constructor.initState)
        updateFleetStateFromLibBattle = false
        break
      case '/kcsapi/api_req_map/start':
      case '/kcsapi/api_req_map/next':
      case '/kcsapi/api_req_map/air_raid': {
        const {
          api_event_kind,
          api_event_id,
          api_destruction_battle,
          api_maparea_id,
          api_destruction_flag,
        } = body
        isHeavyBomberDefense =
          api_destruction_flag === 1 || path === '/kcsapi/api_req_map/air_raid'
        sortieState = SortieState.Navigation
        eventId = api_event_id === undefined ? eventId : api_event_id
        eventKind = api_event_kind === undefined ? eventKind : api_event_kind
        mapAreaId = api_maparea_id === undefined ? mapAreaId : api_maparea_id
        ;({
          enemyFleet,
          enemyEscort,
          landBase,
          airForce,
        } = this.constructor.initState)
        // land base air raid
        if (api_destruction_battle != null) {
          const destructionBattleArray = Array.isArray(api_destruction_battle)
            ? api_destruction_battle
            : [api_destruction_battle]
          destructionBattleArray.forEach(destructionBattle => {
            // construct virtual fleet to reprsent the base attack
            const { airbase } = this.props
            const {
              api_air_base_attack,
              api_f_maxhps,
              api_f_nowhps,
            } = destructionBattle
            const parsed_api_air_base_attack =
              typeof api_air_base_attack === 'string'
                ? JSON.parse(api_air_base_attack)
                : api_air_base_attack
            landBase = _(airbase)
              .filter(squad => squad.api_area_id === mapAreaId)
              .map(
                squad =>
                  new Ship({
                    id: -1,
                    owner: ShipOwner.Ours,
                    pos: squad.api_rid,
                    maxHP: api_f_maxhps[squad.api_rid - 1] || 200,
                    nowHP: api_f_nowhps[squad.api_rid - 1] || 0,
                    items: map(squad.api_plane_info, plane => plane.api_slotid),
                    raw: squad,
                  }),
              )
              .value()
            // construct enemy
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
              api_ship_ke,
              api_eSlot,
              api_e_maxhps,
              api_e_nowhps,
              api_ship_lv,
            )
            // simulation
            battleForm = EngagementMap[(api_formation || {})[2]] || ''
            eFormation = FormationMap[(api_formation || {})[1]] || ''

            const {
              api_stage1,
              api_stage2,
              api_stage3,
            } = parsed_api_air_base_attack
            airForce = getAirForceStatus([api_stage1, api_stage2, api_stage3])
            airControl = AirControlMap[(api_stage1 || {}).api_disp_seiku] || ''
            if (!isNil(api_stage3)) {
              const { api_fdam } = api_stage3
              landBase = map(landBase, (squad, index) => {
                const lostHP = api_fdam[index] || 0
                const nowHP = squad.nowHP - lostHP
                return {
                  ...squad,
                  lostHP,
                  nowHP,
                }
              })
            } else {
              landBase = map(landBase, squad => ({
                ...squad,
                lostHP: 0,
              }))
            }
            result = { rank: t(lostKind[api_lost_kind] || '') }
            isBaseDefense = true
          })
        }
        const isBoss = body.api_event_id === 5
        this.battle = new Battle({
          type: isBoss ? BattleType.Boss : BattleType.Normal,
          map: [],
          desc: null,
          time: null, // Assign later
          fleet: null, // Assign later
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
        const { api_deckname } = body
        dispatch(
          onGetPracticeInfo({
            title: api_deckname,
          }),
        )
        updateFleetStateFromLibBattle = false
        break
      }
      case '/kcsapi/api_req_practice/battle': {
        this.battle = new Battle({
          type: BattleType.Practice,
          map: [],
          desc: null,
          time: null, // Assign later
          fleet: null, // Assign later
          packet: [],
        })
        updateFleetStateFromLibBattle = true
        break
      }
      default:
      /* do nothing */
    }
    let newState = {}
    if (updateFleetStateFromLibBattle) {
      // Update fleet state from lib-battle
      const packet = Object.clone(body)
      packet.poi_path = e.detail.path
      if (!this.battle.fleet) {
        const [_mainFleet, _escortFleet] = transformToDazzyDingClass(
          fleets,
          equips,
        )
        this.battle.fleet = new Fleet({
          type: _escortFleet ? sortie.combinedFlag : 0,
          main: _mainFleet,
          escort: _escortFleet,
          support: null,
          LBAC: null,
        })
      }
      if (!this.battle.packet) {
        this.battle.packet = []
      }
      this.battle.packet.push(packet)
      // Battle Result
      if (e.detail.path.includes('result')) {
        const title = (packet.api_enemy_info || {}).api_deck_name
        const { sortieMapId, currentNode } = sortie
        const spot = `${sortieMapId}-${currentNode}`
        const { fFormation } = this.state
        dispatch(
          onBattleResult({
            spot,
            title,
            fFormation,
          }),
        )
        newState = this.handlePacketResult(this.battle)
        this.battle = null
      } else {
        newState = this.handlePacket(this.battle)
      }
    } else if (!isEqual(propsFleets, fleets) || !isEqual(propsEquips, equips)) {
      // Update fleet state from props
      const [_mainFleet, _escortFleet] = transformToLibBattleClass(
        fleets,
        equips,
      )
      newState = {
        ...newState,
        mainFleet: _mainFleet,
        escortFleet: _escortFleet,
        propsFleets: fleets,
        propsEquips: equips,
      }
    }
    this.setState({
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
    })
  }

  render() {
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
    } = this.state

    const { fleetIds, layout } = this.props

    const finalLayout =
      layout === 'auto' ? getAutoLayout(width, height) : layout

    return (
      <Container id="plugin-prophet" ref={this.root}>
        <BattleViewArea
          mainFleet={mainFleet}
          escortFleet={escortFleet}
          enemyFleet={enemyFleet}
          enemyEscort={enemyEscort}
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
          root={this.root.current}
        />
      </Container>
    )
  }
}

export const Prophet = compose(
  withNamespaces([PLUGIN_KEY, 'resources'], { nsMode: 'fallback' }),
  connect(state => {
    const sortie = state.sortie || {}
    const sortieStatus = sortie.sortieStatus || []
    const airbase = state.info.airbase || {}
    const fleetIds = []
    if (sortieStatus.reduce((a, b) => a || b)) {
      sortieStatus.forEach((a, i) => {
        if (a) fleetIds.push(i)
      })
    } else if (sortie.combinedFlag) {
      fleetIds.push(0, 1)
    } else if (
      filter(get(state, 'info.fleets.2.api_ship'), id => id > 0).length === 7
    ) {
      // FIXME: 17 autumn event 7 ship fleet
      fleetIds.push(2)
    } else {
      fleetIds.push(0)
    }
    const fleets = fleetIds.map(i =>
      adjustedFleetShipsDataSelectorFactory(i)(state),
    )
    const equips = fleetIds.map(i =>
      fleetShipsEquipDataSelectorFactory(i)(state),
    )
    return {
      sortie,
      airbase,
      fleets,
      equips,
      fleetIds,
      layout: get(state.config, 'plugin.prophet.layout', 'auto'),
    }
  }),
)(ProphetBase)
