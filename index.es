import React, { Component } from 'react'
import { isEqual, isNil, each, map, isEmpty, includes, concat, get } from 'lodash'
import { join } from 'path'
// import fs from 'fs-extra'
import { connect } from 'react-redux'
import { Row, Col, Grid, Checkbox } from 'react-bootstrap'
import semver from 'semver'

import { fleetShipsDataSelectorFactory, fleetShipsEquipDataSelectorFactory } from 'views/utils/selectors'

import BattleViewArea from './views/battle-view-area'
import { PLUGIN_KEY, initEnemy, spotInfo, getSpotKind, lostKind } from './utils'
import { Models, Simulator } from './lib/battle'


const { Ship, ShipOwner, StageType, Battle, BattleType, Fleet,
  FormationMap, EngagementMap, AirControlMap } = Models


const { i18n, ROOT, getStore, dispatch } = window
// const { fleetShipsDataSelectorFactory } = require(`${ROOT}/views/utils/selectors`)

const __ = i18n[PLUGIN_KEY].__.bind(i18n[PLUGIN_KEY])

const updateByStageHp = (fleet, nowhps) => {
  if (!fleet || !nowhps) return fleet
  return fleet.map((ship) => {
    while (nowhps[0] && nowhps[0] === -1) {
      nowhps.shift()
    }
    if (ship) {
      return {
        ...ship,
        stageHP: nowhps.shift(),
      }
    }
    return ship
  })
}

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

  each(stages, (stage) => {
    if (isNil(stage)) return
    const { engagement, aerial, type } = (stage || {})
    if (engagement && type == StageType.Engagement) {
      // There might be multiple engagements (day and night)
      // fortunately the formation is the same for now
      battleForm = (engagement || {}).engagement || ''
      eFormation = (engagement || {}).eFormation || ''
      fFormation = (engagement || {}).fFormation || ''
    }
    if (aerial && type == StageType.Aerial) {
      // There might be multiple aerial stages, e.g. 1-6 air battle
      const { fPlaneInit, fPlaneNow, ePlaneInit, ePlaneNow, control } = aerial
      // [t_api_f_count, t_api_f_lostcount, t_api_e_count, t_api_e_lostcount]
      const fLost = (fPlaneInit || 0) - (fPlaneNow || 0)
      const eLost = (ePlaneInit || 0) - (ePlaneNow || 0)
      // [fPlaneInit, fLost, ePlaneInit, eLost]
      airForce = [
        Math.max((fPlaneInit || 0), airForce[0]),
        fLost + airForce[1],
        Math.max((ePlaneInit || 0), airForce[2]),
        eLost + airForce[3],
      ]
      airControl = control || ''
    }
  })

  let api_nowhps
  let api_nowhps_combined
  each(packets, (packet) => {
    if (packet) {
      if (packet.api_nowhps) {
        api_nowhps = packet.api_nowhps.slice()
      }
      if (packet.api_nowhps_combined) {
        api_nowhps_combined = packet.api_nowhps_combined.slice()
      }
    }
  })

  if (api_nowhps) {
    mainFleet = updateByStageHp(mainFleet, api_nowhps)
    enemyFleet = updateByStageHp(enemyFleet, api_nowhps)
  }

  if (api_nowhps_combined) {
    escortFleet = updateByStageHp(escortFleet, api_nowhps_combined)
    enemyEscort = updateByStageHp(enemyEscort, api_nowhps_combined)
  }

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
  stages.forEach((stage) => {
    if (stage) {
      const { api_f_count, api_f_lostcount, api_e_count, api_e_lostcount } = stage
      t_api_f_count = Math.max(t_api_f_count, api_f_count || 0)
      t_api_f_lostcount += api_f_lostcount || 0
      t_api_e_count = Math.max(t_api_e_count, api_e_count || 0)
      t_api_e_lostcount += api_e_lostcount || 0
    }
  })
  return [t_api_f_count, t_api_f_lostcount, t_api_e_count, t_api_e_lostcount]
}

// sortieState
// 0: port, switch on when /kcsapi/api_port/port
// 1: before battle, switch on when /kcsapi/api_req_map/start or /kcsapi/api_req_map/next
// 2: battle, switch on with PM emit type
// 3: practice, switch on with PM emit type

// actions

const onBattleResult = ({ spot, fFormation, title }) => {
  return {
    type: '@@poi-plugin-prophet@updateHistory',
    spot,
    fFormation,
    title,
  }
}

const onGetPracticeInfo = ({ title }) => {
  return {
    type: '@@poi-plugin-prophet@updatePractice',
    title,
  }
}

export const reactClass = connect(
  (state) => {
    const sortie = state.sortie || {}
    const sortieStatus = sortie.sortieStatus || []
    const airbase = state.info.airbase || {}
    const fleet = [0, 1, 2, 3]
    // if (sortieStatus.reduce((a, b) => a || b)) {
    //   sortieStatus.forEach((a, i) => {
    //     if (a) fleet.push(i)
    //   })
    // } else if (sortie.combinedFlag) {
    //   fleet.push(0, 1)
    // } else {
    //   fleet.push(0)
    // }
    const fleets = fleet.map(i => fleetShipsDataSelectorFactory(i)(state))
    const equips = fleet.map(i => fleetShipsEquipDataSelectorFactory(i)(state))
    return {
      sortie,
      airbase,
      fleets,
      equips,
      combinedFlag: sortie.combinedFlag,
    }
  }
)(class Prophet extends Component {
  constructor(props) {
    super(props)
    const sortieStatus = props.sortie.sortieStatus || []
    const fleetId = sortieStatus.reduce((a, b) => a || b)
      ? sortieStatus.findIndex(a => a)
      : 0
    const [mainFleet, escortFleet]
      = this.transformToLibBattleClass(props.fleets, props.equips, fleetId + 1, props.combinedFlag)
    this.state = {
      ...this.constructor.initState,
      mainFleet,
      escortFleet,
    }
  }
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
    spotKind: '',
    result: {},
    battleForm: '', // api_formation[2]
    eFormation: '', // enemy formation, api_formation[1]
    fFormation: '',
    combinedFlag: 0, // 0=无, 1=水上打击, 2=空母機動, 3=輸送
  }

  componentWillReceiveProps(nextProps) {
    const sortieStatus = nextProps.sortie.sortieStatus || []
    const fleetId = sortieStatus.reduce((a, b) => a || b)
      ? sortieStatus.findIndex(a => a)
      : 0
    const [mainFleet, escortFleet]
      = this.transformToLibBattleClass(nextProps.fleets, nextProps.equips, fleetId + 1, nextProps.combinedFlag)
    
    const fleetUpdate = this.state.sortieState < 2
      && (!isEqual(mainFleet, this.state.mainFleet) || !isEqual(escortFleet, this.state.escortFleet))
    const combinedFlagUpdate = nextProps.combinedFlag != null
      && nextProps.combinedFlag !== this.state.combinedFlag
    let newState = {}
    if (fleetUpdate) {
      newState = {
        ...newState,
        mainFleet,
        escortFleet,
      }
    }
    if (combinedFlagUpdate) {
      newState = {
        ...newState,
        combinedFlag: nextProps.combinedFlag,
      }
    }
    if (fleetUpdate || combinedFlagUpdate) {
      this.setState(newState)
    }
  }

  componentDidMount() {
    // initialize repsonse listener
    window.addEventListener('game.response', this.handleGameResponse)

    // for debug (ugly)
    if (window.dbg.isEnabled()) window.prophetTest = e => this.setState(this.handlePacket(e))
  }

  componentWillUnmount() {
    window.removeEventListener('game.response', this.handleGameResponse)

    delete window.prophetTest
  }

  transformToLibBattleClass = (fleets, equips, deckId = 1, combinedFlag = 0) =>
    (fleets || []).map((fleet, fleetPos) =>
      (fleet || []).map(([_ship, $ship], shipPos) =>
        new Ship({
          id: _ship.api_ship_id,
          owner: ShipOwner.Ours,
          pos: (fleetPos * 6) + shipPos + 1,
          maxHP: _ship.api_maxhp,
          nowHP: _ship.api_nowhp,
          initHP: _ship.api_nowhp,
          lostHP: 0,
          damage: 0,
          items: equips[fleetPos][shipPos].map(e => (e ? e[0].api_slotitem_id : null)),
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
            ..._ship,
            poi_slot: equips[fleetPos][shipPos].map(e => (e ? e[0] : null)),
            poi_slot_ex: null,
          },
        })
      )
    ).slice(deckId - 1, deckId + (combinedFlag && true))

  transformToDazzyDingClass = (fleets, equips, deckId = 1, combinedFlag = 0) =>
    (fleets || []).map((fleet, fleetPos) =>
      (fleet || []).map(([_ship, $ship], shipPos) => ({
        ...$ship,
        ..._ship,
        poi_slot: equips[fleetPos][shipPos].map(e => (e ? e[0] : null)),
        poi_slot_ex: null,
      }))
    ).slice(deckId - 1, deckId + (combinedFlag && true))

  handlePacket = (e) => {
    const sortieState = e.type == (BattleType.Practice || BattleType.Pratice) ? 3 : 2
    // console.log(e)
    const simulator = new Simulator(e.fleet, { usePoiAPI: true })
    map(e.packet, packet => simulator.simulate(packet))
    const result = simulator.result

    // Attention, aynthesizeStage will break object prototype, put it to last
    const newState = synthesizeInfo(simulator, result, e.packet)
    return {
      ...newState,
      sortieState,
      result,
    }
  }

  handlePacketResult = (e) => {
    const newState = this.handlePacket(e)
    // notify heavily damaged
    // as battle result does not touch hps, it is safe to notify here?
    const { mainFleet, escortFleet } = this.state
    const escapedPos = this.props.sortie.escapedPos || []
    const friendShips = concat(mainFleet, escortFleet)
    const damageList = []

    each(friendShips, (ship) => {
      if (ship == null) return
      if ((ship.nowHP / ship.maxHP <= 0.25)
        && !includes(escapedPos, ship.pos - 1)
        && this.state.sortieState != 3) {
        const shipName = getStore(`const.$ships.${ship.raw.api_ship_id}.api_name`, ' ')
        damageList.push(i18n.resources.__(shipName))
      }
    })

    if (!isEmpty(damageList) && config.get('plugin.prophet.notify.enable', true)) {
      window.notify(`${damageList.join(', ')} ${__('Heavily damaged')}`, {
        type: 'damaged',
        icon: join(ROOT, 'views', 'components', 'main', 'assets', 'img', 'state', '4.png'),
        audio: config.get('plugin.prophet.notify.damagedAudio'),
      })
    }
    return {
      ...newState,
    }
  }

  handleGameResponse = (e) => {
    const { path, body, postBody } = e.detail
    // used in determining next spot type
    const {
      mainFleet,
      escortFleet,
    } = { ...this.state }

    let {
      enemyFleet,
      enemyEscort,
      landBase,
      airForce,
      airControl,
      isBaseDefense,
      sortieState,
      spotKind,
      result,
      battleForm,
      eFormation,
    } = { ...this.state }
    isBaseDefense = false
    switch (path) {
    case '/kcsapi/api_port/port':
      this.battle = null
      enemyFleet = this.constructor.initState.enemyFleet
      enemyEscort = this.constructor.initState.enemyEscort
      sortieState = this.constructor.initState.sortieState
      spotKind = this.constructor.initState.spotKind
      result = this.constructor.initState.result
      break
    case '/kcsapi/api_req_map/start':
    case '/kcsapi/api_req_map/next': {
      const { api_event_kind, api_event_id, api_destruction_battle } = body
      sortieState = 1
      spotKind = spotInfo[getSpotKind(api_event_id, api_event_kind)] || ''
      enemyFleet = []
      enemyEscort = []
      landBase = []
      // land base air raid
      if (api_destruction_battle != null && semver.gte(window.POI_VERSION, '7.2.0')) {
        // construct virtual fleet to reprsent the base attack
        const { sortie, airbase } = this.props
        const mapArea = Math.floor((sortie.sortieMapId || 0) / 10)
        const { api_air_base_attack, api_maxhps, api_nowhps } = api_destruction_battle
        each(airbase, (squad) => {
          if (squad.api_area_id != mapArea) return
          landBase.push(new Ship({
            id: -1,
            owner: ShipOwner.Ours,
            pos: squad.api_rid,
            maxHP: api_maxhps[squad.api_rid] || 200,
            nowHP: api_nowhps[squad.api_rid] || 0,
            items: map(squad.api_plane_info, plane => plane.api_slotid),
            raw: squad,
          }))
        })
        // construct enemy
        const { api_ship_ke, api_eSlot, api_ship_lv, api_lost_kind, api_formation } = api_destruction_battle
        enemyFleet = initEnemy(0, api_ship_ke, api_eSlot, api_maxhps, api_nowhps, api_ship_lv)
        // simulation
        battleForm = EngagementMap[(api_formation || {})[2]] || ''
        eFormation = FormationMap[(api_formation || {})[1]] || ''

        const { api_stage1, api_stage2, api_stage3 } = api_air_base_attack
        airForce = getAirForceStatus([api_stage1, api_stage2, api_stage3])
        airControl = AirControlMap[(api_stage1 || {}).api_disp_seiku] || ''
        if (!isNil(api_stage3)) {
          const { api_fdam } = api_stage3
          landBase = map(landBase, (squad, index) => {
            const lostHP = api_fdam[index + 1] || 0
            const nowHP = squad.nowHP - lostHP
            return {
              ...squad,
              lostHP,
              nowHP,
            }
          })
        } else {
          landBase = map(landBase, (squad, index) => {
            return {
              ...squad,
              lostHP: 0,
            }
          })
        }
        result = { rank: __(lostKind[api_lost_kind] || '') }
        isBaseDefense = true
      }
      const isBoss = (body.api_event_id === 5)
      this.battle = new Battle({
        type: isBoss ? BattleType.Boss : BattleType.Normal,
        map: [],
        desc: null,
        time: null,  // Assign later
        fleet: null,  // Assign later
        packet: [],
      })
      break
    }
    case '/kcsapi/api_req_member/get_practice_enemyinfo': {
      const { api_deckname } = body
      dispatch(onGetPracticeInfo({
        title: api_deckname,
      }))
      break
    }
    case '/kcsapi/api_req_practice/battle': {
      this.battle = new Battle({
        type: BattleType.Practice,
        map: [],
        desc: null,
        time: null,  // Assign later
        fleet: null,  // Assign later
        packet: [],
      })
    }
    }
    let newState = {}
    if (this.battle &&
      !['/kcsapi/api_req_map/start', '/kcsapi/api_req_map/next', '/kcsapi/api_req_map/start_air_base'].includes(path)) {
      const packet = Object.clone(body)
      packet.poi_path = e.detail.path
      if (!this.battle.fleet) {
        const sortieStatus = this.props.sortie.sortieStatus
        let deckId = parseInt(postBody.api_deck_id)
        const fleetId = sortieStatus.reduce((a, b) => a || b)
          ? sortieStatus.findIndex(a => a)
          : 0
        deckId = Number.isNaN(deckId) ? fleetId + 1 : deckId

        const { fleets, equips } = this.props
        const [_mainFleet, _escortFleet] = this.transformToDazzyDingClass(fleets, equips, deckId, this.state.combinedFlag)
        this.battle.fleet = new Fleet({
          type: _escortFleet ? this.state.combinedFlag : 0,
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
        const fFormation = this.state.fFormation
        dispatch(onBattleResult({
          spot,
          title,
          fFormation,
        }))
        newState = this.handlePacketResult(this.battle)
        this.battle = null
      } else if (this.battle) {
        newState = this.handlePacket(this.battle)
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
      spotKind,
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
      sortieState,
      spotKind,
      result,
      battleForm,
      eFormation,
    } = this.state
    return (
      <div id="plugin-prophet">
        <link rel="stylesheet" href={join(__dirname, 'assets', 'prophet.css')} />
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
          spotKind={spotKind}
          result={result}
          battleForm={battleForm}
          eFormation={eFormation}
        />
      </div>
    )
  }
})

const CheckboxLabelConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    undecided: props.undecided,
    label: props.label,
  })
})(class checkboxLabelConfig extends Component {
  static propTypes = {
    label: React.PropTypes.string,
    configName: React.PropTypes.string,
    value: React.PropTypes.bool,
    undecided: React.PropTypes.bool,
  }
  handleChange = () => {
    config.set(this.props.configName, !this.props.value)
  }
  render() {
    return (
      <Row className={this.props.undecided ? 'undecided-checkbox-inside' : ''} >
        <Col xs={12} >
          <Grid>
            <Col xs={12} >
              <Checkbox
                disabled={this.props.undecided}
                checked={this.props.undecided ? false : this.props.value}
                onChange={this.props.undecided ? null : this.handleChange}
              >
                {this.props.label}
              </Checkbox>
            </Col>
          </Grid>
        </Col>
      </Row>
    )
  }
})

export const settingsClass = () =>
  <div>
    <CheckboxLabelConfig
      label={__('Show scales on HP bar')}
      configName="plugin.prophet.showScale"
      defaultVal
    />
    <CheckboxLabelConfig
      label={__('Display enemy combined fleet in game order')}
      configName="plugin.prophet.ecGameOrder"
      defaultVal
    />
    <CheckboxLabelConfig
      label={__('Show enemy deck name if available')}
      configName="plugin.prophet.showEnemyTitle"
      defaultVal
    />
    <CheckboxLabelConfig
      label={__('Show last chosen formation hint')}
      configName="plugin.prophet.showLastFormation"
      defaultVal
    />
    <CheckboxLabelConfig
      label={__('Ship parameters include equipment bonus')}
      configName="plugin.prophet.useFinalParam"
      defaultVal
    />
    <CheckboxLabelConfig
      label={__('Heavily damaged notification')}
      configName="plugin.prophet.notify.enable"
      defaultVal
    />
  </div>


export function reducer(state = {}, action) {
  const { type, spot, fFormation, title } = action
  switch (type) {
  case '@@poi-plugin-prophet@updateHistory':
    return {
      ...state,
      [spot]: {
        fFormation,
        title,
      },
    }
  case '@@poi-plugin-prophet@updatePractice':
    return {
      ...state,
      practice: {
        title,
      },
    }
  }
  return state
}
