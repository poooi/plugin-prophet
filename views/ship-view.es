import FontAwesome from 'react-fontawesome'
import {join} from 'path'
import React, {Component} from 'react'
import {Panel, Grid, Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import componentQueries from 'react-component-queries'
import {compose} from 'redux'
import {connect} from 'react-redux'
import _ from 'lodash'

import {SlotitemIcon} from 'views/components/etc/icon'
import {getCondStyle} from 'views/utils/game-utils'
const { ROOT, $ships, $slotitems} = window

import ItemView from './item-view'
import {getShipName, getItemName} from './utils'
import {FABar, HPBar} from './bar'


const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

// maybe can use compose for co-exist with redux connect

const ShipView = compose(
componentQueries(
  ({width}) => ({compact: width < 250})
),
connect(
  (state) => ({toEscapeIndex: state.sortie._toEscapeIndex || []})
)
)(class ShipView extends React.Component {


  render() {
    let {child: ship} = this.props
    if (! (ship && ship.id > 0)) {
      return <div />
    }
    let isEscape = _.includes(this.props.toEscapeIndex, ship.id)
    let raw = ship.raw || {}
    let mst = $ships[ship.id] || {}
    let data = Object.assign(Object.clone(mst), raw)

    if (! data.api_maxeq) {
      data.api_maxeq = []
    }
    if (! data.api_onslot) {
      data.api_onslot = data.api_maxeq
    }

    const tooltip = 
      <Tooltip id={`slotinfo-${data.api_id}`}>
        <div className='ship-info'>
          <span>Lv.</span>
          <span>{data.api_lv || '-'}</span>

          <span><FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} /></span>
          <span><FABar icon={2} max={data.api_bull_max} now={data.api_bull} /></span>

          {(data.poi_slot || []).map((item, i) =>
          <ItemView key={i} item={item} extra={false}
            warn={data.api_onslot[i] !== data.api_maxeq[i]} />
          )}
          
          <ItemView item={data.poi_slot_ex} extra={true} label={'+'} warn={false} />
        </div>
      </Tooltip>

    return (
      <Row className={"ship-view "+ (this.props.compact? "compact " : ' ') + (isEscape ? "escape" : '' )}>

          <Col xs={this.props.compact? 10 : 4} className='ship-name'>
          <OverlayTrigger
          placement="top"
          overlay={tooltip}
          trigger="click"
          >
            <span>
              <span className={data.api_cond && getCondStyle(data.api_cond)}>
              {getShipName(data)}
              {data.api_cond ? <span className="cond-indicator"><FontAwesome name="star"/> {data.api_cond}</span>  : ''}
              </span>
              <span className={"position-indicator"}>{ship.owner=='Ours'? '': `(${ship.id})`}</span>
            </span>
          </OverlayTrigger>
          </Col>

          <Col xs={this.props.compact? 2 : 1} className='ship-damage'>
            {ship.damage != null ? ship.damage : '' }
          </Col>

          <Col xs={this.props.compact? 12 : 7} className='ship-hp'>
            <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} item={ship.useItem} />
        </Col>

      </Row>
    )
  }
})

export default ShipView