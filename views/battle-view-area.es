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
import SquadView from './squad-view'
import BattleInfo from './battle-info'
import DropInfo from './drop-info'

const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

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
    const {simulator, layout, sortieState} = this.props
    let View = sortieState == 1 ? SquadView : null
    let friendTitle = 'Sortie Fleet'
    let enemyTitle = sortieState == 3 ? 'PvP' : 'Enemy Vessel'
    const times = layout == 'horizontal' ? 1 : 2
    // adapt the view according to layout by setting FleetView's Col xs = 12/count
    // this can support 12v6, 6v12 and 12v12
    let fleetCount = 1 && _.sumBy([simulator.mainFleet, simulator.escortFleet], (fleet) => fleet != null)
    let enemyCount = 1 && _.sumBy([simulator.enemyFleet, simulator.enemyEscort], (fleet) => fleet != null)

    const {api_stage1, result, api_formation} = simulator
    let {getShip, getItem} = _.pick(result, ['getShip', 'getItem'])
    let {api_f_count, api_f_lostcount, api_e_count, api_e_lostcount} = _.pick(api_stage1, ['api_f_count', 'api_f_lostcount', 'api_e_count', 'api_e_lostcount'])
    return (
      <div id="overview-area">
        {
          (simulator && sortieState != 0) ? (
            <Grid>
              
                {
                  sortieState ? 
                  <Row className="friend-title title">
                    <Col xs={12/times}>
                      {__(friendTitle) + (api_f_count ? ` [${api_f_count - api_f_lostcount}/${api_f_count}]`: '')}
                    </Col>
                  </Row> : 
                  ''
                }
              
              <Row>
                <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} count={times * fleetCount} View={View}/>
                <FleetView fleet={simulator.escortFleet} title={__('Escort Fleet')} count={times * fleetCount} View={View}/>
              </Row>
              
                {
                  sortieState ? 
                  <Row className="enemy-title title">
                    <Col xs={12/times}>
                      {__(enemyTitle) + (api_e_count ? ` [${api_e_count - api_e_lostcount}/${api_e_count}]`: '')}
                    </Col>
                  </Row> : 
                  ''
                }
              
              <Row>
                <FleetView fleet={simulator.enemyEscort} title={__('Enemy Escort Fleet')} count={times * enemyCount}/>
                <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} count={times * enemyCount}/>
              </Row>
              { 
                sortieState > 1 &&
                <BattleInfo 
                  result = {result && result.rank }
                  formation ={api_formation && api_formation[1]}
                  intercept = {api_formation && api_formation[2]}
                  seiku = {api_stage1 && api_stage1.api_disp_seiku}
                />
              }
              {
                (getShip || getItem) &&
                  <DropInfo
                    getShip = {getShip}
                    getItem = {getItem} 
                  />
              }
            </Grid>
          ) : __("Not in sortie")
        }
      </div>
    )
  }
})

export default BattleViewArea


