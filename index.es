import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import Inspector from 'react-inspector'
import _ from 'lodash'
import {Grid, Row, Col, Button, Form, FormGroup, ControlLabel, FormControl} from 'react-bootstrap'
import {join} from 'path'
// import fs from 'fs-extra'
import { connect } from 'react-redux'
import { promisifyAll } from 'bluebird'
const fs = promisifyAll (require ('fs-extra'))
const CSON = promisifyAll(require('cson'))
import {store} from 'views/create-store'

import BattleViewArea from './views/battle-view-area'
import NextSpotInfo from './views/next-spot-info'
import BattleInfo from './views/battle-info'


import {PacketManager, Simulator} from './lib/battle'
import {Ship, ShipOwner, StageType, BattleType} from './lib/battle/models'

const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

// information related to spot info, will move to utils or something later

const spotInfo = {
  '0': '',
  '1': 'Start',
  '2': 'Unknown',
  '3': 'Obtain Resources',
  '4': 'Lose Resources',
  '5': 'Battle',
  '6': 'Boss Battle',
  '7': 'Battle Avoid',
  '8': 'Air Strike',
  '9': 'Escort Success',
  '10': 'Transport Munitions',
  '11': 'Long Distance Aerial Battle', //長距離空襲戦
  '12': 'Manual Selection',
  '13': 'Aerial Recon',
  '14': 'Night Battle',
  '15': 'Enemy Combined Fleet',
}

const dispSeiku = {
  '1': "Air Parity",
  '2': "AS+",
  '3': "AS",
  '4': "Air Incapability",
  '5': "Air Denial",
}

// give spot kind according to api_event_id and api_event_kind
// update according to https://github.com/andanteyk/ElectronicObserver/blob/1052a7b177a62a5838b23387ff35283618f688dd/ElectronicObserver/Other/Information/apilist.txt
const getSpotKind = (api_event_id, api_event_kind) => {
  console.log(api_event_id, api_event_kind)
  if (api_event_id == 4){ //4=通常戦闘
    if (api_event_kind == 2) return 14 //2=夜戦
    if (api_event_kind == 4) return 9 //4=航空戦
    if (api_event_kind == 5) return 15 //5=敵連合艦隊戦
    if (api_event_kind == 6) return 11 //6=長距離空襲戦
  }
  if (api_event_id === 6) { //6=気のせいだった
    if (api_event_kind === 1) { //1="敵影を見ず。"
      return 7
    } else if (api_event_kind === 2) { // 2=能動分岐
      return 12
    }
  } else if (api_event_id === 7) { //7=航空戦or航空偵察
    if (api_event_kind === 0) { //4=航空戦
      return 13
    }
  }
  return api_event_id + 1
}


const initEnemy = (intl=0, api_ship_ke, api_eSlot, api_maxhps, api_nowhps, api_ship_lv) => {
  if (!(api_ship_ke != null)) return
  let fleet = []
  for (const i of _.range(1, 7)) {
    let id    = api_ship_ke[i]
    let slots = api_eSlot[i - 1] || []
    let ship, raw
    if (Number.isInteger(id) && id > 0) {
      raw = {
        api_ship_id: id,
        api_lv: api_ship_lv[i],
        poi_slot: slots.map(id => window.$slotitems[id]),
      }
      ship = new Ship({
        id   : id,
        owner: ShipOwner.Enemy,
        pos  : intl + i,
        maxHP: api_maxhps[i + 6],
        nowHP: api_nowhps[i + 6],
        items: [],  // We dont care
        raw  : raw,
      })
    }
    fleet.push(ship)
  }
  return fleet
}

// extracts necessary information from its stages, returns a new simulator
// infomation: 
const synthesizeStage = (_simulator) => {
  let simulator = Object.clone(_simulator)
  
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
    if (!_.isNil(api_stage1)) {
      simulator = {
        ...simulator,
        api_stage1,
      }

    }
  })

  return simulator
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


// sortiePhase
// 0: port, switch on when /kcsapi/api_port/port
// 1: before battle, switch on when /kcsapi/api_req_map/start or /kcsapi/api_req_map/next
// 2: battle, switch on with PM emit type
// 3: practice, switch on with PM emit type



export const reactClass = connect(
  (state) => {
    const sortie = state.sortie || {} 
    return {
      sortie,
    }
  }
)(class Prophet extends Component {
  constructor(){
    super()
    this.state ={
      simulator:{},
      sortiePhase: 0,
      spotKind: '',
    }
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
    .catch ((e) => console.log('Failed to load map data!', e.stack))

    fs.readFileAsync(join(__dirname, 'assets', 'data', 'maproute.cson'))
    .then ((data) =>{
      const mapspot = CSON.parseCSONString(data)
      store.dispatch({
        type: '@@poi-plugin-prophet/updateMaproute',
        data: mapspot,
      })
    })
    .catch ((e) => console.log('Failed to load map route!', e.stack))
  }

  componentDidMount() {
    // initialize PacketManager
    this.pm = new PacketManager()
    this.pm.addListener('battle', this.handlePacket)
    this.pm.addListener('result', this.handlePacket)

    // initialize repsonse listener
    window.addEventListener('game.response', this.handleGameResponse)
  }

  componentWillUnmount() {
    this.pm.removeListener('battle', this.handlePacket)
    this.pm.removeListener('result', this.handlePacket)

    window.removeEventListener('game.response', this.handleGameResponse)
  }

  testProphet = (e) => {
    const fpath = join(__dirname, 'test', ReactDOM.findDOMNode(this.fileName).value +'.json')
    try {
      fs.accessSync(fpath)
    
      const data = fs.readJsonSync(fpath)
      this.handlePacket(data)
    }
    catch(err) {
      console.log(err)
    }
  }


  handlePacket = (e) => {
    let sortiePhase = e.type == BattleType.Practice ? 3 : 2
    let simulator = new Simulator(e.fleet, {usePoiAPI: true})
    fs.outputJson(join(__dirname, 'test', Date.now()+'.json'), e, (err)=> {if (err != null) console.log(err)})
    let stage = _.map(e.packet, (packet) => simulator.simulate(packet) )
    let result = simulator.result

    // Attention, aynthesizeStage will break object prototype, put it to last
    simulator = synthesizeStage(simulator)
    this.setState({
      sortiePhase,
      simulator,
      result,
    })
  }

  handleGameResponse = (e) => {
    const {path, body, postBody} = e.detail

    // used in determining next spot type
    let {api_event_kind, api_event_id, api_destruction_battle} = body
    let simulator = {}

    switch(path){

    case '/kcsapi/api_port/port':
      this.setState({
        sortiePhase: 0,
        simulator,
      })
      break

    case '/kcsapi/api_req_map/start':
    case '/kcsapi/api_req_map/next':
      if (api_destruction_battle != null) {
        // construct virtual fleet to reprsent the base attack
        let {api_air_base_attack, api_maxhps, api_nowhps} = api_destruction_battle
        let landBase = []

        _.each(api_air_base_attack.api_squadron_plane, (squad, index)=>{
          if (!Array.isArray(squad)) return
          landBase.push(new Ship({
            id: -1,
            owner: ShipOwner.Ours,
            pos: index,
            maxHP: api_maxhps[index] || 200,
            nowHP: api_nowhps[index] || 0,
            items: _.map(squad, plane => plane != null ? plane.mst_id : null), // only $items id, may copy from store?
            raw: squad,
          }))
        })


        const {api_ship_ke, api_eSlot, api_ship_lv} = api_destruction_battle
        let enemy = initEnemy(0, api_ship_ke, api_eSlot, api_maxhps, api_nowhps, api_ship_lv)



        // simulation
        const {api_stage1, api_stage3} = api_air_base_attack
        simulator.air_result = api_stage1
        
        const {api_fdam} = api_stage3
        landBase = _.map(landBase, (squad, index) =>{
          squad.lostHP = api_fdam[index+1] || 0
          squad.nowHP -= squad.lostHP
          return squad
        })

        simulator.mainFleet = landBase
        simulator.enemyFleet = enemy

      }

      this.setState({
        sortiePhase: 1,
        spotKind: spotInfo[getSpotKind(api_event_id, api_event_kind)] || '',
        simulator,
      })
      break
    }


  }


  render() {
    const {simulator, result} = this.state
    let {api_search, api_formation, api_stage1} = simulator

    return (
      <div id="plugin-prophet">
      <link rel="stylesheet" href={join(__dirname, 'assets', 'prophet.css')} />
        <Grid>
        <Row>
          <Col xs={12}>
            <BattleViewArea simulator={this.state.simulator || {}} sortiePhase={this.state.sortiePhase}/>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <NextSpotInfo spotKind={this.state.spotKind}/>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>{
            simulator &&
            <BattleInfo 
              result = {result && result.rank }
              formation ={api_formation && api_formation[1]}
              intercept = {api_formation && api_formation[2]}
              seiku = {api_stage1 && api_stage1.api_disp_seiku}
            />
          }
          </Col>
        </Row>
          <Row>
            <Col xs={12}>
              <Inspector data={this.state}/>
              <Inspector data={this.props}/>
            </Col>
          </Row>
        </Grid>
        <Row>
          <Col>
              <Form inline>
                <FormGroup controlId="formInlineEmail">
                  <ControlLabel>Timestamp</ControlLabel>
                  <FormControl type="text" ref={(ref) => this.fileName = ref}/>.json
                </FormGroup>
                <Button onClick={this.testProphet}>
                  Simulate
                </Button>
              </Form>
          </Col>
        </Row>
      </div>
      )
  }
})
