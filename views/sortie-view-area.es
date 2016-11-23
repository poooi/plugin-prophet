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
import BattleInfo from './battle-info'
import NextSpotInfo from './next-spot-info'
import SquadView from './squad-view'

const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

const SortieViewArea = connect(
  (state, props) => ({
    layout: _.get(state, 'config.poi.layout', 'horizontal'),
  })
)(class SortieViewArea extends React.Component {
  constructor() {
    super()

  }

  static defaultProps = {
    simulator: {},
  }

  render() {
    const {simulator, layout} = this.props
    const times = layout == 'horizontal' ? 1 : 2
    let fleetCount = 1 && _.sumBy([simulator.mainFleet, simulator.escortFleet], (fleet) => fleet != null)
    let enemyCount = 1 && _.sumBy([simulator.enemyFleet, simulator.enemyEscort], (fleet) => fleet != null)
    const {api_stage1, result, api_formation} = simulator
    let {api_f_count, api_f_lostcount, api_e_count, api_e_lostcount} = _.pick(api_stage1, ['api_f_count', 'api_f_lostcount', 'api_e_count', 'api_e_lostcount'])
    return (
      <div id="overview-area">
        {
          simulator.mainFleet ? 
            <Grid>
              <Row className="friend-title title">
                <Col xs={12}>
                  {__('Land Base') + (api_f_count ? ` [${api_f_count - api_f_lostcount}/${api_f_count}]`: '')}
                </Col>
              </Row>
              <Row>
                <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} count={times * fleetCount} View={SquadView}/>
              <Row className="enemy-title title">
                <Col xs={12}>
                  {__('Enemy Vessel') + (api_e_count ? ` [${api_e_count - api_e_lostcount}/${api_e_count}]`: '')}
                </Col>
              </Row>
                <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} count={times * enemyCount}/>
              </Row>
              <BattleInfo 
                  result = {result && result.rank }
                  formation ={api_formation && api_formation[1]}
                  intercept = {api_formation && api_formation[2]}
                  seiku = {api_stage1 && api_stage1.api_disp_seiku}
              />
              <NextSpotInfo spotKind={this.props.spotKind}/>
            </Grid>
           : 
          <NextSpotInfo spotKind={this.props.spotKind}/>
        }
      </div>
    )
  }
})

export default SortieViewArea