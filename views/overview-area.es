import {getShipName, getItemName} from './utils'
import FontAwesome from 'react-fontawesome'
import {join} from 'path'
import React, {Component} from 'react'
const { ROOT, $ships, $slotitems} = window
import {Panel, Grid, Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {SlotitemIcon} from 'views/components/etc/icon'
import {FABar, HPBar} from './bar'
import _ from 'lodash'

import FleetView from './fleet-view'
import LBACView from './lbac-view'

const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

export default class OverviewArea extends React.Component {
  constructor() {
    super()

  }

  static defaultProps = {
    simulator: {},
  }

  render() {
    const {simulator} = this.props
    let fleetCount = 1 && _.sumBy([simulator.mainFleet, simulator.escortFleet], (fleet) => fleet != null)
    let enemyCount = 1 && _.sumBy([simulator.enemyFleet, simulator.enemyEscort], (fleet) => fleet != null)
    return (
      <div id="overview-area">
        {
          simulator ? (
            <Grid>
              <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} count={fleetCount}/>
              <FleetView fleet={simulator.escortFleet} title={__('Escort Fleet')} count={fleetCount}/>
              <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} count={enemyCount}/>
              <FleetView fleet={simulator.enemyEscort} title={__('Enemy Escort Fleet')} count={enemyCount}/>
            </Grid>
          ) : __("No battle")
        }
      </div>
    )
  }
}


