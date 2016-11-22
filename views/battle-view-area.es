import {getShipName, getItemName} from './utils'
import FontAwesome from 'react-fontawesome'
import {join} from 'path'
import React, {Component} from 'react'
const { ROOT, $ships, $slotitems} = window
import {Panel, Grid, Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {SlotitemIcon} from 'views/components/etc/icon'
import {FABar, HPBar} from './bar'
import _ from 'lodash'
import { connect } from 'react-redux'

import FleetView from './fleet-view'
import LBACView from './lbac-view'

const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

const BattleViewArea = connect(
  (state, props) => ({
    layout: _.get(state, 'config.poi.layout', 'horizontal'),
  })
)(class BattleViewArea extends React.Component {
  constructor() {
    super()

  }

  static defaultProps = {
    simulator: {},
  }

  render() {
    const {simulator, layout} = this.props
    const times = layout == 'horizontal' ? 1 : 2
    // adapt the view according to layout by setting FleetView's Col xs = 12/count
    // this can support 12v6, 6v12 and 12v12
    let fleetCount = 1 && _.sumBy([simulator.mainFleet, simulator.escortFleet], (fleet) => fleet != null)
    let enemyCount = 1 && _.sumBy([simulator.enemyFleet, simulator.enemyEscort], (fleet) => fleet != null)
    return (
      <div id="overview-area">
        {
          simulator ? (
            <Grid>
              <Row>
                <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} count={times * fleetCount}/>
                <FleetView fleet={simulator.escortFleet} title={__('Escort Fleet')} count={times * fleetCount}/>
              </Row>
              <Row>
                <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} count={times * enemyCount}/>
                <FleetView fleet={simulator.enemyEscort} title={__('Enemy Escort Fleet')} count={times * enemyCount}/>
              </Row>
            </Grid>
          ) : __("No battle")
        }
      </div>
    )
  }
})

export default BattleViewArea


