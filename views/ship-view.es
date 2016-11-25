import FontAwesome from 'react-fontawesome'
import React, {Component} from 'react'
import { Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {connect} from 'react-redux'
import _ from 'lodash'
import {getCondStyle} from 'views/utils/game-utils'

const { $ships} = window

import ItemView from './item-view'
import {getShipName} from './utils'
import {FABar, HPBar} from './bar'


const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])


const ShipView = connect(
  (state, props) => ({
    escapedPos: state.sortie.escapedPos || [],
    child: props.child,
  })
)(class ShipView extends Component {



  render() {
    let {child: ship} = this.props

    if (! (ship && ship.id > 0)) {
      return <div />
    }
    let isEscaped = _.includes(this.props.escapedPos, ship.pos-1) && ship.owner == 'Ours'
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
      <div className="div-row ship-item">
        <div className={"ship-view " + (isEscaped ? "escaped" : '' )}>
          <OverlayTrigger
            placement="left"
            overlay={tooltip}
            trigger="click"
          >
            <div className="ship-info">
              <div className='ship-name'>
                {getShipName(data)}
                <span className="position-indicator">{ship.owner=='Ours'? '': ` (${ship.id})`}</span>
              </div>
              <div className={'ship-damage '+ (ship.isMvp ? getCondStyle(100) : '') }>
                {ship.isMvp ? <FontAwesome name='trophy' /> : ''}
                {isEscaped ? <FontAwesome name="reply"/> : (ship.damage || 0) }
              </div>
            </div>
          </OverlayTrigger>
        </div>
        <div className='ship-hp'>
            <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} item={ship.useItem} cond={data.api_cond} />
        </div>
      </div>
    )
  }
})

export default ShipView
