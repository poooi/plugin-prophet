import React, {Component} from 'react'
import Inspector from 'react-inspector'
import {PacketManager, Simulator} from './lib/battle'
import _ from 'lodash'
import {Grid, Row, Col} from 'react-bootstrap'
import OverviewArea from './views/overview-area'
import {join} from 'path'


const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])



export const reactClass = class Prophet extends Component {
  constructor(){
    super()
    this.state ={
      simulator:{},
      stages:{},
    }
  }

  componentDidMount() {
    // initialize PacketManager
    this.pm = new PacketManager()
    this.pm.addListener('battle', this.handlePacket)
    this.pm.addListener('result', this.handlePacket)

    // initialize repsonse listener
  }

  componentWillUnmount() {
    this.pm.removeListener('battle', this.handlePacket)
    this.pm.removeListener('result', this.handlePacket)
  }

  handlePacket = (e) => {
    let simulator = new Simulator(e.fleet, {usePoiAPI: true})
    let stages = _.flatMap(e.packet, (packet) => simulator.simulate(packet) )
    this.setState({
      simulator,
      stages,
    })
  }

  render() {
    return (
      <div id="plugin-prophet">
      <link rel="stylesheet" href={join(__dirname, 'assets', 'prophet.css')} />
        <Grid>
        <Row>
        <Col xs={12}>
          <OverviewArea simulator={this.state.simulator || {}}/>
        </Col>
        </Row>
          <Row>
            <Col xs={12}>
              <Inspector data={this.state}/>
            </Col>
          </Row>
        </Grid>
      </div>
      )
  }
}