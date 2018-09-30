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
import { join } from 'path'
import { connect } from 'react-redux'
import { observe } from 'redux-observers'
import memoize from 'fast-memoize'
import { createSelector } from 'reselect'
import { translate } from 'react-i18next'

import {
  fleetShipsDataSelectorFactory,
  fleetShipsEquipDataSelectorFactory,
  fleetSelectorFactory,
} from 'views/utils/selectors'
import { store } from 'views/create-store'

import BattleViewArea from './views/battle-view-area'
import { PLUGIN_KEY, initEnemy, lostKind, getAutoLayout } from './utils'
import { Models, Simulator } from './lib/battle'
import {
  onBattleResult,
  onGetPracticeInfo,
  historyObserver,
  useitemObserver,
} from './redux'

const {
  Ship,
  ShipOwner,
  StageType,
  Battle,
  BattleType,
  Fleet,
  FormationMap,
  EngagementMap,
  AirControlMap,
} = Models

const { ROOT, getStore, dispatch } = window
// const { fleetShipsDataSelectorFactory } = require(`${ROOT}/views/utils/selectors`)

// const __ = i18next.getFixedT(null, [PLUGIN_KEY, 'resources'])

const updateByStageHp = (fleet, nowhps) => {
  if (!fleet || !nowhps) {
    return fleet
  }
  return fleet.map(
    (ship, i) =>
      !ship
        ? ship
        : {
            ...ship,
            stageHP: nowhps[i],
          },
  )
}

const transformToLibBattleClass = (fleets, equips) =>
  (fleets || [])
    .map((fleet, fleetPos) =>
      (fleet || []).map(
        ([_ship, $ship] = [], shipPos) =>
          !_ship
            ? null
            : new Ship({
                id: _ship.api_ship_id,
                owner: ShipOwner.Ours,
                pos: fleetPos * 6 + shipPos + 1,
                maxHP: _ship.api_maxhp,
                nowHP: _ship.api_nowhp,
                initHP: _ship.api_nowhp,
                lostHP: 0,
                damage: 0,
                items: equips[fleetPos][shipPos].map(
                  e => (e ? e[0].api_slotitem_id : null),
                ),
                useItem: null,
                baseParam: [
                  $ship.api_houg[0] + _ship.api_kyouka[0],
                  $ship.api_raig[0] + _ship.api_kyouka[1],
                  $ship.api_tyku[0] + _ship.api_kyouka[2],
                  $ship.api_souk[0] + _ship.api_kyouka[3],
                ],
                finalParam: [
                  _ship.api_karyoku[0],
                  _ship.api_raisou[0],
                  _ship.api_taiku[0],
                  _ship.api_soukou[0],
                ],
                raw: {
                  ...$ship,
                  ..._ship,
                  poi_slot: equips[fleetPos][shipPos].map(
                    e => (e ? e[0] : null),
                  ),
                  poi_slot_ex: null,
                },
              }),
      ),
    )
    .concat([undefined, undefined])
    .slice(0, 2)

const transformToDazzyDingClass = (fleets, equips) =>
  (fleets || [])
    .map((fleet, fleetPos) =>
      (fleet || []).map(
        ([_ship, $ship] = [], shipPos) =>
          !_ship
            ? null
            : {
                ...$ship,
                ..._ship,
                poi_slot: equips[fleetPos][shipPos].map(e => (e ? e[0] : null)),
                poi_slot_ex: null,
              },
      ),
    )
    .concat([undefined, undefined])
    .slice(0, 2)

const updateIfExist = (obj, key, prev) => get(obj, key, prev)

// extracts necessary information
// infomation: mvp, formation, aerial, hp (day and night)
const synthesizeInfo = (_simulator, result, packets) => {
  let { mainFleet, escortFleet, enemyFleet, enemyEscort } = { ..._simulator }
  const { stages } = { ..._simulator }
  let airForce = [0, 0, 0, 0] // [fPlaneInit, fLost, ePlaneInit, eLost]
  let airControl = ''
  let fFormation = ''
  let eFormation = ''
  let battleForm = ''
  // assign mvp to specific ship
  const [mainMvp, escortMvp] = result.mvp || [0, 0]
  if (!(mainMvp < 0 || mainMvp > 6)) mainFleet[mainMvp].isMvp = true
  if (!(escortMvp < 0 || escortMvp > 6)) escortFleet[escortMvp].isMvp = true

  let fResidule = 0
  let fLost = 0
  let eResidule = 0
  let eLost = 0

  each(stages, stage => {
    if (isNil(stage)) return
    const { engagement, aerial, type } = stage || {}

    if (engagement && type === StageType.Engagement) {
      // There might be multiple engagements (day and night)
      // fortunately the formation is the same for now
      battleForm = (engagement || {}).engagement || ''
      eFormation = (engagement || {}).eFormation || ''
      fFormation = (engagement || {}).fFormation || ''
    }

    if (aerial && type === StageType.Aerial) {
      // There might be multiple aerial stages, e.g. jet assult, 1-6 air battle
      const { fPlaneInit, fPlaneNow, ePlaneInit, ePlaneNow, control } = aerial
      // [t_api_f_count, t_api_f_lostcount, t_api_e_count, t_api_e_lostcount]
      fResidule = fPlaneNow
      eResidule = ePlaneNow
      fLost += (fPlaneInit || 0) - (fPlaneNow || 0)
      eLost += (ePlaneInit || 0) - (ePlaneNow || 0)
      // [fPlaneInit, fLost, ePlaneInit, eLost]
      airControl = control || ''
    }
  })

  airForce = [fResidule + fLost, fLost, eResidule + eLost, eLost]

  let api_f_nowhps
  let api_e_nowhps
  let api_f_nowhps_combined
  let api_e_nowhps_combined
  each(packets, packet => {
    api_f_nowhps = updateIfExist(packet, 'api_f_nowhps', api_f_nowhps)
    api_e_nowhps = updateIfExist(packet, 'api_e_nowhps', api_e_nowhps)
    api_f_nowhps_combined = updateIfExist(
      packet,
      'api_f_nowhps_combined',
      api_f_nowhps_combined,
    )
    api_e_nowhps_combined = updateIfExist(
      packet,
      'api_e_nowhps_combined',
      api_e_nowhps_combined,
    )
  })

  mainFleet = updateByStageHp(mainFleet, api_f_nowhps)
  enemyFleet = updateByStageHp(enemyFleet, api_e_nowhps)

  escortFleet = updateByStageHp(escortFleet, api_f_nowhps_combined)
  enemyEscort = updateByStageHp(enemyEscort, api_e_nowhps_combined)

  return {
    mainFleet,
    escortFleet,
    enemyFleet,
    enemyEscort,
    airControl,
    airForce,
    battleForm,
    eFormation,
    fFormation,
    result,
  }
}

const getAirForceStatus = (stages = []) => {
  let t_api_f_count = 0
  let t_api_f_lostcount = 0
  let t_api_e_count = 0
  let t_api_e_lostcount = 0
  stages.forEach(stage => {
    if (stage) {
      const {
        api_f_count,
        api_f_lostcount,
        api_e_count,
        api_e_lostcount,
      } = stage
      t_api_f_count = Math.max(t_api_f_count, api_f_count || 0)
      t_api_f_lostcount += api_f_lostcount || 0
      t_api_e_count = Math.max(t_api_e_count, api_e_count || 0)
      t_api_e_lostcount += api_e_lostcount || 0
    }
  })
  return [t_api_f_count, t_api_f_lostcount, t_api_e_count, t_api_e_lostcount]
}

/* selector */
const fleetSlotCountSelectorFactory = memoize(fleetId =>
  createSelector([fleetSelectorFactory(fleetId)], fleet =>
    get(fleet, 'api_ship.length', 0),
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

// sortieState
// 0: port, switch on when /kcsapi/api_port/port
// 1: before battle, switch on when /kcsapi/api_req_map/start or /kcsapi/api_req_map/next
// 2: battle, switch on with PM emit type
// 3: practice, switch on with PM emit type

@translate([PLUGIN_KEY, 'resources'], { nsMode: 'fallback' })
@connect(state => {
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
  const equips = fleetIds.map(i => fleetShipsEquipDataSelectorFactory(i)(state))
  return {
    sortie,
    airbase,
    fleets,
    equips,
    fleetIds,
    layout: get(state.config, 'plugin.prophet.layout', 'auto'),
  }
})
class Prophet extends Component {
  static initState = {
    mainFleet: [], // An array of fleet
    escortFleet: [],
    enemyFleet: [],
    enemyEscort: [],
    landBase: [],
    airForce: [0, 0, 0, 0], // [fPlaneInit, fLost, ePlaneInit, eLost]
    airControl: '', // 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
    isBaseDefense: false,
    sortieState: 0, // 0: port, 1: before battle, 2: battle, 3: practice
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
      battle.type === (BattleType.Practice || BattleType.Pratice) ? 3 : 2
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
    const { t } = this.props
    const newState = this.handlePacket(battle)
    // notify heavily damaged
    // as battle result does not touch hps, it is safe to notify here?
    const { mainFleet, escortFleet } = this.state
    const escapedPos = this.props.sortie.escapedPos || []
    const friendShips = concat(mainFleet, escortFleet)
    const damageList = []

    each(friendShips, ship => {
      if (ship == null) return
      if (
        ship.nowHP / ship.maxHP <= 0.25 &&
        !includes(escapedPos, ship.pos - 1) &&
        this.state.sortieState !== 3
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
        icon: join(
          ROOT,
          'views',
          'components',
          'main',
          'assets',
          'img',
          'state',
          '4.png',
        ),
        audio: config.get('plugin.prophet.notify.damagedAudio'),
      })
    }
    return {
      ...newState,
    }
  }

  handleGameResponse = e => {
    const { t } = this.props
    const { path, body } = e.detail
    // used in determining next spot type

    const { mainFleet, escortFleet } = this.state

    let {
      enemyFleet,
      enemyEscort,
      landBase,
      airForce,
      airControl,
      isBaseDefense,
      sortieState,
      eventId,
      eventKind,
      result,
      battleForm,
      eFormation,
    } = this.state
    isBaseDefense = false
    switch (path) {
      case '/kcsapi/api_start2': // refresh game page
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
        break
      case '/kcsapi/api_req_map/start':
      case '/kcsapi/api_req_map/next': {
        const {
          api_event_kind,
          api_event_id,
          api_destruction_battle,
          api_maparea_id,
        } = body
        sortieState = 1
        eventId = api_event_id
        eventKind = api_event_kind
        ;({
          enemyFleet,
          enemyEscort,
          landBase,
          airForce,
        } = this.constructor.initState)
        // land base air raid
        if (api_destruction_battle != null) {
          // construct virtual fleet to reprsent the base attack
          const { airbase } = this.props
          const {
            api_air_base_attack,
            api_f_maxhps,
            api_f_nowhps,
          } = api_destruction_battle
          landBase = _(airbase)
            .filter(squad => squad.api_area_id === api_maparea_id)
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
          } = api_destruction_battle
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

          const { api_stage1, api_stage2, api_stage3 } = api_air_base_attack
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
        break
      }
      case '/kcsapi/api_req_member/get_practice_enemyinfo': {
        const { api_deckname } = body
        dispatch(
          onGetPracticeInfo({
            title: api_deckname,
          }),
        )
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
        break
      }
      default:
      /* do nothing */
    }
    let newState = {}
    if (
      this.battle &&
      ![
        '/kcsapi/api_req_map/start',
        '/kcsapi/api_req_map/next',
        '/kcsapi/api_req_map/start_air_base',
      ].includes(path)
    ) {
      const packet = Object.clone(body)
      packet.poi_path = e.detail.path
      if (!this.battle.fleet) {
        const [_mainFleet, _escortFleet] = transformToDazzyDingClass(
          this.props.fleets,
          this.props.equips,
        )
        this.battle.fleet = new Fleet({
          type: _escortFleet ? this.props.sortie.combinedFlag : 0,
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
        const { sortieMapId, currentNode } = this.props.sortie
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
      } else if (this.battle) {
        newState = this.handlePacket(this.battle)
      }
    }
    // Update fleet info from props
    const { propsFleets, propsEquips } = this.state
    if (
      (!isEqual(propsFleets, this.props.fleets) ||
        !isEqual(propsEquips, this.props.equips)) &&
      !this.battle &&
      !e.detail.path.includes('result')
    ) {
      const [_mainFleet, _escortFleet] = transformToLibBattleClass(
        propsFleets,
        propsEquips,
      )
      newState = {
        ...newState,
        mainFleet: _mainFleet,
        escortFleet: _escortFleet,
        propsFleets: this.props.fleets,
        propsEquips: this.props.equips,
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
      sortieState,
      eventId,
      eventKind,
      result,
      battleForm,
      eFormation,
      ...newState,
    })
  }

  root = React.createRef()

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
      <div id="plugin-prophet" ref={this.root}>
        <link
          rel="stylesheet"
          href={join(__dirname, 'assets', 'prophet.css')}
        />
        <BattleViewArea
          mainFleet={mainFleet}
          escortFleet={escortFleet}
          enemyFleet={enemyFleet}
          enemyEscort={enemyEscort}
          landBase={landBase}
          airForce={airForce}
          airControl={airControl}
          isBaseDefense={isBaseDefense}
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
      </div>
    )
  }
}

export const reactClass = Prophet

export settingsClass from './settings-class'

export { reducer } from './redux'

export const switchPluginPath = [
  '/kcsapi/api_req_map/start',
  '/kcsapi/api_req_practice/battle',
  '/kcsapi/api_req_map/next',
]

// FIXME: Eggs for April 1st, to remove in next version
const today = new Date()
let chibaStyle
export const pluginDidLoad = () => {
  if (today.getDate() === 1 && today.getMonth() === 3) {
    chibaStyle = document.createElement('style')
    chibaStyle.innerHTML = `
.progress,
.hp-indicator {
  transform: skewX(-15deg);
}
.hp-indicator {
  height: 7px !important;
}
    `
    document.head.appendChild(chibaStyle)
  }
}

export const pluginWillUnload = () => {
  if (chibaStyle) {
    chibaStyle.remove()
  }
}
