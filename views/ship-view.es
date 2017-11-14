import React from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import _ from 'lodash'
import { getCondStyle } from 'views/utils/game-utils'
import { resolve } from 'path'

import ItemView from './item-view'
import { getShipName } from '../utils'
import { FABar, HPBar } from './bar'


// const { i18n } = window
// const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

const ParamIcon = ({ name = '' }) => {
  const iconPath = resolve(__dirname, `../assets/icons/${name}.svg`)
  return <span className="param-icon"><img src={iconPath} className="svg prophet-icon" alt={name} /></span>
}

ParamIcon.propTypes = {
  name: PropTypes.string,
}

const placements = {
  0: 'left', // horizontal, normal 00
  1: 'right', // horizontal, reversed 01
  2: 'top', // vertical, normal 10
  3: 'bottom', // vertical reversed 11
}

// fParam: [0]=火力, [1]=雷装, [2]=対空, [3]=装甲
const paramNames = ['firepower', 'torpedo', 'AA', 'armor']

const ShipView = connect(
  (state, props) => {
    const api_ship_id = _.get(props.ship, 'raw.api_ship_id', -1)
    return {
      escapedPos: state.sortie.escapedPos || [],
      ship: props.ship,
      layout: _.get(state, 'config.poi.layout', 'horizontal'),
      reverseLayout: _.get(state, 'config.poi.reverseLayout'),
      $ship: _.get(state, `const.$ships.${api_ship_id}`) || {},
      useFinalParam: _.get(state, 'config.plugin.prophet.useFinalParam', true),
    }
  }
)(({
  ship, $ship, escapedPos, layout, reverseLayout, useFinalParam,
}) => {
  if (!(ship && ship.id > 0)) {
    return <div />
  }
  const isEscaped = _.includes(escapedPos, ship.pos - 1) && ship.owner === 'Ours'
  const raw = ship.raw || {}
  const data = {
    ...$ship,
    ...raw,
  }

  if (!data.api_maxeq) {
    data.api_maxeq = []
  }
  if (!data.api_onslot) {
    data.api_onslot = data.api_maxeq
  }

  const param = (useFinalParam ? ship.finalParam : ship.baseParam) || []

  const tooltip = (
    <Tooltip id={`slotinfo-${data.api_id}`} className="ship-pop prophet-pop">
      <div className="prophet-tip">
        <div className="ship-essential">
          <span className="position-indicator">{ship.owner === 'Ours' ? '' : `ID ${ship.id}`}</span>
          <span>Lv. {data.api_lv || '-'}</span>

          <span><FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} /></span>
          <span><FABar icon={2} max={data.api_bull_max} now={data.api_bull} /></span>
        </div>
        <div className="ship-parameter">
          {
            paramNames.map((name, idx) =>
              (typeof param[idx] !== 'undefined') &&
              <span key={name}>
                <ParamIcon name={name} />
                {param[idx]}
              </span>
          )
          }
        </div>

        {
          // the key in ItemView uses index as a special case since it won't be reordered,
          // ignore this eslint warning
          (data.poi_slot || []).map((item, i) =>
            item &&
            <ItemView
              // eslint-disable-next-line
              key={i}
              item={item}
              extra={false}
              warn={data.api_onslot[i] !== data.api_maxeq[i]}
            />
          )
        }

        <ItemView item={data.poi_slot_ex} extra label="+" warn={false} />
      </div>
    </Tooltip>
  )

  return (
    <div className={`div-row ship-item ${isEscaped ? 'escaped' : ''}`}>
      <div className="ship-view">
        <OverlayTrigger
          placement={placements[parseInt(`${+(layout === 'vertical')}${+(reverseLayout)}`, 2)]}
          overlay={tooltip}
        >
          <div className="ship-info">
            <div className="ship-name" title={getShipName(data)}>
              <span>{getShipName(data)}</span>
            </div>
            <div className={`ship-damage ${ship.isMvp ? getCondStyle(100) : ''}`}>
              {ship.isMvp ? <FontAwesome name="trophy" /> : ''}
              {isEscaped ? <FontAwesome name="reply" /> : (ship.damage || 0) }
            </div>
          </div>
        </OverlayTrigger>
      </div>
      <div className="ship-hp">
        <HPBar
          max={ship.maxHP}
          from={ship.initHP}
          to={ship.nowHP}
          damage={ship.lostHP}
          stage={ship.stageHP}
          item={ship.useItem}
          cond={data.api_cond}
        />
      </div>
    </div>
  )
})

export default ShipView
