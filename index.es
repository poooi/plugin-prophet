import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import {join} from 'path'
// import fs from 'fs-extra'
import { connect } from 'react-redux'
import { promisifyAll } from 'bluebird'
const fs = promisifyAll (require ('fs-extra'))
const CSON = promisifyAll(require('cson'))
import {store} from 'views/create-store'
import semver from 'semver'

import BattleViewArea from './views/battle-view-area'

import {initEnemy, spotInfo, getSpotKind, lostKind} from './utils'


import {PacketManager, Simulator} from './lib/battle'
import {Ship, ShipOwner, StageType, BattleType} from './lib/battle/models'
import { fleetShipsDataSelectorFactory, fleetShipsEquipDataSelectorFactory } from 'views/utils/selectors'

const { i18n, ROOT } = window
//const { fleetShipsDataSelectorFactory } = require(`${ROOT}/views/utils/selectors`)

const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])


// information related to spot info, will move to utils or something later





// extracts necessary information from its stages, returns a new simulator
// infomation:
const synthesizeStage = (_simulator, result) => {
  let simulator = Object.clone(_simulator)
  // assign mvp to specific ship
  let [mainMvp, escortMvp] = result.mvp || [0, 0]
  if (!( mainMvp<0 || mainMvp >6 )) simulator.mainFleet[mainMvp].isMvp = true
  if (!( escortMvp<0 || escortMvp >6 )) simulator.escortFleet[escortMvp].isMvp = true

  _.each(simulator.stages, (stage) => {
    if (_.isNil(stage)) return
    let api_stage1 = _.get(stage,'kouku.api_stage1')
    let {api_search, api_formation} = _.pick(stage.api, ['api_search', 'api_formation'])
    if(stage.type == StageType.Engagement) {
      simulator = {
        ...simulator,
        api_search,
        api_formation,
      }
    }
    if (!_.isNil(api_stage1) && stage.type == StageType.Aerial ) {
      simulator = {
        ...simulator,
        api_stage1,
      }

    }
  })

  return ({
    ...simulator,
    result,
  })
}



// reducer for mapspot and maproute data
export const reducer = (state, action) => {
  if (state == null) {
    state = {}
  }
  if (action.type === '@@poi-plugin-prophet/updateMapspot') {
    return ({
      ...state,
      mapspot: action.data,
    })
  }
  if (action.type === '@@poi-plugin-prophet/updateMaproute') {
    return ({
      ...state,
      maproute: action.data,
    })
  }
  return state
}


// sortieState
// 0: port, switch on when /kcsapi/api_port/port
// 1: before battle, switch on when /kcsapi/api_req_map/start or /kcsapi/api_req_map/next
// 2: battle, switch on with PM emit type
// 3: practice, switch on with PM emit type



export const reactClass = connect(
  (state) => {
    const sortie = state.sortie || {}
    const sortieStatus = sortie.sortieStatus || []
    const airbase = state.info.airbase || {}
    const fleet = []
    if (sortie.combinedFlag) {
      fleet.push(0, 1)
    } else if (sortieStatus.reduce((a, b) => a || b)) {
      sortieStatus.forEach((a, i) => {
        if (a) fleet.push(i)
      })
    } else {
      fleet.push(0)
    }
    const fleets = fleet.map(i => fleetShipsDataSelectorFactory(i)(state))
    const equips = fleet.map(i => fleetShipsEquipDataSelectorFactory(i)(state))
    return {
      sortie,
      airbase,
      fleets,
      equips,
    }
  }
)(class Prophet extends Component {
  constructor(){
    super()
    this.state ={
      ...this.constructor.initState,
    }
  }
  static initState ={
    simulator:{},
    sortieState: 0,
    spotKind: '',
    result: {},
  }

  componentWillMount() {
    fs.readFileAsync(join(__dirname, 'assets', 'data', 'mapspot.cson'))
    .then ((data) =>{
      const mapspot = CSON.parseCSONString(data)
      store.dispatch({
        type: '@@poi-plugin-prophet/updateMapspot',
        data: mapspot,
      })
    })
    .catch ((e) => console.warn('Failed to load map data!', e.stack))

    fs.readFileAsync(join(__dirname, 'assets', 'data', 'maproute.cson'))
    .then ((data) =>{
      const mapspot = CSON.parseCSONString(data)
      store.dispatch({
        type: '@@poi-plugin-prophet/updateMaproute',
        data: mapspot,
      })
    })
    .catch ((e) => console.warn('Failed to load map route!', e.stack))
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.fleets !== nextProps.fleets || this.props.equips !== nextProps.equips) {
      const [mainFleet, escortFleet] = this.transFormToBattleLibClass(nextProps.fleets, nextProps.equips)
      this.setState({
        simulator: {
          ...this.state.simulator,
          mainFleet,
          escortFleet,
        },
      })
    }
  }

  componentDidMount() {
    // initialize PacketManager
    this.pm = new PacketManager()
    this.pm.addListener('battle', this.handlePacket)
    this.pm.addListener('result', this.handlePacketResult)

    // initialize repsonse listener
    window.addEventListener('game.response', this.handleGameResponse)
  }

  componentWillUnmount() {
    this.pm.removeListener('battle', this.handlePacket)
    this.pm.removeListener('result', this.handlePacketResult)

    window.removeEventListener('game.response', this.handleGameResponse)
  }

  transFormToBattleLibClass = (fleets, equips) =>
    fleets.map((fleet, fleetPos) =>
      fleet.map(([_ship, $ship], shipPos) =>
        new Ship({
          id: _ship.api_ship_id,
          owner: ShipOwner.Ours,
          pos: fleetPos * 6 + shipPos + 1,
          maxHP: _ship.api_maxhp,
          nowHP: _ship.api_nowhp,
          initHP: _ship.api_nowhp,
          lostHP: 0,
          damage: 0,
          items: equips[fleetPos][shipPos].map(e => e ? e[0].api_slotitem_id : null),
          useItem: null,
          raw: {
            ..._ship,
            poi_slot: equips[fleetPos][shipPos].map(e => e ? e[0] : null),
          },
        })
      )
    ).concat(undefined).slice(0, 2)

  handlePacket = (e) => {
    let sortieState = e.type == (BattleType.Practice || BattleType.Pratice ) ? 3 : 2
    let simulator = new Simulator(e.fleet, {usePoiAPI: true})
    let stage = _.map(e.packet, (packet) => simulator.simulate(packet) )
    let result = simulator.result

    // Attention, aynthesizeStage will break object prototype, put it to last
    simulator = synthesizeStage(simulator, result)
    this.setState({
      sortieState,
      simulator,
      result,
    })
  }

  handlePacketResult = (e) => {
    this.handlePacket(e)
    // notify heavily damaged
    // as battle result does not touch hps, it is safe to notify here?
    const {mainFleet, escortFleet} = this.state.simulator
    const escapedPos = this.props.sortie.escapedPos || []
    const friendShips = _.concat(mainFleet, escortFleet)
    let damageList = []

    _.each(friendShips, (ship)=>{

      if (ship == null) return
      if ((ship.nowHP / ship.maxHP < 0.25) && !_.includes(escapedPos, ship.pos -1) && this.state.sortieState != 3 ) {
        let shipName = _.get(window.$ships, `${ship.raw.api_ship_id}.api_name`,' ')
        damageList.push(i18n.resources.__(shipName))
      }
    })

    if (!_.isEmpty(damageList)) {
      window.notify(`${damageList.join(', ')} ${__('Heavily damaged')}`,{
        type: 'damaged',
        icon: join(ROOT, 'views', 'components', 'main', 'assets', 'img', 'state', '4.png'),
        audio: config.get('plugin.prophet.notify.damagedAudio'),
      })
    }
  }

  handleGameResponse = (e) => {
    const {path, body} = e.detail
    // used in determining next spot type
    let {api_event_kind, api_event_id, api_destruction_battle} = body
    let {simulator} = {...this.state}
    switch (path) {
    case '/kcsapi/api_port/port':
      this.setState({
        simulator: {
          mainFleet: this.state.simulator.mainFleet,
          escortFleet: this.state.simulator.escortFleet,
        },
        sortieState: 0,
        spotKind: '',
        result: {},
      })
      break
    case '/kcsapi/api_req_map/start':
    case '/kcsapi/api_req_map/next':
      delete simulator.enemyFleet
      delete simulator.enemyEscort
      // land base air raid
      if (api_destruction_battle != null && semver.gte(window.POI_VERSION, '7.2.0')) {
        // construct virtual fleet to reprsent the base attack
        let {sortie, airbase} = this.props
        let mapArea = Math.floor((sortie.sortieMapId || 0) / 10)
        let {api_air_base_attack, api_maxhps, api_nowhps} = api_destruction_battle
        let landBase = []
        _.each(airbase, (squad) => {
          if (squad.api_area_id != mapArea) return
          landBase.push(new Ship({
            id: -1,
            owner: ShipOwner.Ours,
            pos: squad.api_rid,
            maxHP: api_maxhps[squad.api_rid] || 200,
            nowHP: api_nowhps[squad.api_rid] || 0,
            items: _.map(squad.api_plane_info, plane => plane.api_slotid),
            raw: squad,
          }))
        })
        // construct enemy
        const {api_ship_ke, api_eSlot, api_ship_lv, api_formation, api_lost_kind} = api_destruction_battle
        let enemy = initEnemy(0, api_ship_ke, api_eSlot, api_maxhps, api_nowhps, api_ship_lv)
        // simulation
        const {api_stage1, api_stage3} = api_air_base_attack
        simulator.api_stage1 = api_stage1
        if (!_.isNil(api_stage3)) {
          const {api_fdam} = api_stage3
          landBase = _.map(landBase, (squad, index) =>{
            squad.lostHP = api_fdam[index+1] || 0
            squad.nowHP -= squad.lostHP
            return squad
          })
        } else {
          landBase = _.map(landBase, (squad, index) => {
            squad.lostHP = 0
            return squad
          })
        }
        simulator.mainFleet = landBase
        simulator.enemyFleet = enemy
        simulator.api_formation = api_formation
        simulator.result={rank: __(lostKind[api_lost_kind] || '')}
        simulator.isAirRaid = true
      } else {
        simulator.isAirRaid = false
      }
      this.setState({
        sortieState: 1,
        spotKind: spotInfo[getSpotKind(api_event_id, api_event_kind)] || '',
        simulator,
      })
      break
    }
  }


  render() {
    return (
      <div id="plugin-prophet">
        <link rel="stylesheet" href={join(__dirname, 'assets', 'prophet.css')} />
        <BattleViewArea simulator={this.state.simulator || {}} sortieState={this.state.sortieState} spotKind={this.state.spotKind}/>
      </div>
    )
  }
})
