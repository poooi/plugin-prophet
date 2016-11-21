import {getShipName, getItemName} from './utils'
import FontAwesome from 'react-fontawesome'
import {join} from 'path'
import React, {Component} from 'react'
const { ROOT, $ships, $slotitems} = window
import {Panel, Grid, Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {SlotitemIcon} from 'views/components/etc/icon'
import {FABar, HPBar} from './bar'
import componentQueries from 'react-component-queries'

import ItemView from './item-view'


const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

// maybe can use compose for co-exist with redux connect

const ShipView = componentQueries(
  ({width}) => ({compact: width <250})
)(class ShipView extends React.Component {
  getCondClass(cond) {
    if (cond == null) {
      return ''
    } else if (cond >= 50) {
      return 'poi-ship-cond-50'
    } else if (cond >= 30) {
      return 'poi-ship-cond-30'
    } else if (cond >= 20) {
      return 'poi-ship-cond-20'
    } else {
      return 'poi-ship-cond-0'
    }
  }

  render() {
    let {child: ship} = this.props
    if (! (ship && ship.id > 0)) {
      return <div />
    }
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
          <span>Cond.</span>
          <span className={this.getCondClass(data.api_cond)}>{data.api_cond || '-'}</span>
          <span><FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} /></span>
          <span><FABar icon={2} max={data.api_bull_max} now={data.api_bull} /></span>

          {(data.poi_slot || []).map((item, i) =>
          <ItemView key={i} item={item} extra={false} label={data.api_onslot[i]}
            warn={data.api_onslot[i] !== data.api_maxeq[i]} />
          )}
          
          <ItemView item={data.poi_slot_ex} extra={true} label={'+'} warn={false} />
        </div>
      </Tooltip>

    return (
      <Row className={"ship-view "+ (this.props.compact? "compact" : '')}>

          <Col xs={this.props.compact? 12 : 5} className='ship-name'>
          <OverlayTrigger
          placement="top"
          overlay={tooltip}
          trigger="click"
          >
            <span>
              <span>{getShipName(data)}</span>
              <span className="position-indicator">{ship.owner=='Ours'? '': `(${ship.id})`}</span>
            </span>
          </OverlayTrigger>
          </Col>

          <Col xs={this.props.compact? 12 : 7} className='ship-hp'>
            <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} item={ship.useItem} />
        </Col>

      </Row>
    )
  }
})

export default ShipView