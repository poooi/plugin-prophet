import FontAwesome from 'react-fontawesome'
import React, {Component} from 'react'
import { OverlayTrigger, Tooltip} from 'react-bootstrap'
import {connect} from 'react-redux'
import _ from 'lodash'
import {getCondStyle} from 'views/utils/game-utils'
import { resolve } from 'path'

import ItemView from './item-view'
import { getShipName } from './utils'
import { FABar, HPBar } from './bar'


// const { i18n } = window
// const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

class ParamIcon extends Component {
  render() {
    const {name} = this.props || ''
    const iconPath = resolve(__dirname, `../assets/icons/${name}.svg`)
    return <span className="prophet-icon param-icon"><img src={iconPath} className="svg"/></span>
  }
}

// fParam: [0]=火力, [1]=雷装, [2]=対空, [3]=装甲
const paramNames = ['firepower', 'torpedo', 'AA', 'armor']

const ShipView = connect(
  (state, props) => {
    const api_ship_id = _.get(props.child, 'raw.api_ship_id') || -1
    return {
      escapedPos: state.sortie.escapedPos || [],
      ship: props.child,
      layout: _.get(state, 'config.poi.layout', 'horizontal'),
      $ship: _.get(state, `const.$ships.${api_ship_id}`) || {},
    }
  }
)(class ShipView extends Component {
  render() {
    let {ship, $ship, escapedPos} = this.props
    if (!(ship && ship.id > 0)) {
      return <div />
    }
    let isEscaped = _.includes(escapedPos, ship.pos-1) && ship.owner == 'Ours'
    let raw = ship.raw || {}
    let data = {
      ...$ship,
      ...raw,
    }

    if (!data.api_maxeq) {
      data.api_maxeq = []
    }
    if (!data.api_onslot) {
      data.api_onslot = data.api_maxeq
    }

    const tooltip =
      <Tooltip id={`slotinfo-${data.api_id}`} className='ship-pop prophet-pop'>
        <div className='prophet-tip'>
          <div className='ship-essential'>
            <span className="position-indicator">{ship.owner=='Ours'? '': `ID ${ship.id}`}</span>
            <span>Lv. {data.api_lv || '-'}</span>

            <span><FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} /></span>
            <span><FABar icon={2} max={data.api_bull_max} now={data.api_bull} /></span>
          </div>

          {
            (data.poi_slot || []).map((item, i) =>
              <ItemView key={i} item={item} extra={false}
                        warn={data.api_onslot[i] !== data.api_maxeq[i]} />
            )
          }

          <ItemView item={data.poi_slot_ex} extra={true} label={'+'} warn={false} />
        </div>
      </Tooltip>


    return (
      <div className="div-row ship-item">
        <div className={"ship-view " + (isEscaped ? "escaped" : '' )}>
          <OverlayTrigger
            placement={this.props.layout === 'horizontal' ? 'left' : 'top'}
            overlay={tooltip}
          >
            <div className="ship-info">
              <div className='ship-name' title={getShipName(data)}>
                {getShipName(data)}
              </div>
              <div className={'ship-damage '+ (ship.isMvp ? getCondStyle(100) : '') }>
                {ship.isMvp ? <FontAwesome name='trophy' /> : ''}
                {isEscaped ? <FontAwesome name="reply"/> : (ship.damage || 0) }
              </div>
            </div>
          </OverlayTrigger>
        </div>
        <div className='ship-hp'>
            <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} stage={ship.stageHP} item={ship.useItem} cond={data.api_cond} />
        </div>
      </div>
    )
  }
})

export default ShipView
