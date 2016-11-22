import FontAwesome from 'react-fontawesome'
import {join} from 'path'
import React, {Component} from 'react'
import {Panel, Grid, Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import componentQueries from 'react-component-queries'


import {SlotitemIcon} from 'views/components/etc/icon'
import {getCondStyle} from 'views/utils/game-utils'
const { ROOT, $ships, $slotitems} = window

import ItemView from './item-view'
import {getShipName, getItemName} from './utils'
import {FABar, HPBar} from './bar'


const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

// maybe can use compose for co-exist with redux connect

const order = {
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
}

// TODO: connect store airbase
const SquadView = componentQueries(
  ({width}) => ({compact: width <250})
)(class SquadView extends React.Component {


  render() {
    let {child: ship} = this.props
    if (ship && ship.id > 0) {
      return <div />
    }
    let pos = ship.pos || 0



    return (
      <Row className={"ship-view "+ (this.props.compact? "compact" : '')}>

          <Col xs={this.props.compact? 12 : 5} className='ship-name'>

              <span>
              {`${order[pos] || ''} Squadron`}
            </span>
          </Col>

          <Col xs={this.props.compact? 12 : 7} className='ship-hp'>
            <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} />
        </Col>

      </Row>
    )
  }
})

export default SquadView