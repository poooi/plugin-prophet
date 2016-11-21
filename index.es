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


import {PacketManager, Simulator} from './lib/battle'

const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])


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
// 2: battle/practice, switch on with PacketManager's emit



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
      stages:{},
      sortiePhase: 0,
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
    console.log(e.packet)
    let simulator = new Simulator(e.fleet, {usePoiAPI: true})
    fs.outputJson(join(__dirname, 'test', Date.now()+'.json'), e, (err)=>console.log(err))
    let stages = _.flatMap(e.packet, (packet) => simulator.simulate(packet) )
    this.setState({
      sortiePhase: 2,
      simulator,
      stages,
    })
  }

  handleGameResponse = (e) => {
    const {path, body, postBody} = e.detail

    switch(path){

    case '/kcsapi/api_port/port':
      this.setState({
        sortiePhase: 0,
      })
      break

    case '/kcsapi/api_req_map/start':
    case '/kcsapi/api_req_map/next':
      this.setState({
        sortiePhase: 1,
      })
    }


  }

  render() {
    return (
      <div id="plugin-prophet">
      <link rel="stylesheet" href={join(__dirname, 'assets', 'prophet.css')} />
        <Grid>
        <Row>
          <Col xs={12}>
            <BattleViewArea simulator={this.state.simulator || {}}/>
          </Col>
        </Row>
        <Row>

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
                  <FormControl type="number" ref={(ref) => this.fileName = ref}/>
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
