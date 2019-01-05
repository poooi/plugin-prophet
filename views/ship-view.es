import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import _ from 'lodash'
import { resolve } from 'path'
import { getCondStyle } from 'views/utils/game-utils'
import { Avatar } from 'views/components/etc/avatar'
import cls from 'classnames'
import { withNamespaces } from 'react-i18next'
import { compose } from 'redux'

import ItemView from './item-view'
import { FABar, HPBar } from './bar'

const ParamIcon = ({ name = '' }) => {
  const iconPath = resolve(__dirname, `../assets/icons/${name}.svg`)
  return (
    <span className="param-icon">
      <img src={iconPath} className="svg prophet-icon" alt={name} />
    </span>
  )
}

ParamIcon.propTypes = {
  name: PropTypes.string,
}

/**
 * compute css font size and font-family info based on main wrapper
 */
const getFont = () => {
  const mainWrapper = document.querySelector('#plugin-prophet')
  if (!mainWrapper) {
    return ''
  }

  const mainWrapperStyle = window.getComputedStyle(mainWrapper, null)

  return `${mainWrapperStyle.getPropertyValue(
    'font-size',
  )} ${mainWrapperStyle.getPropertyValue('font-family')}`
}

const textCanvas = document.createElement('canvas')
let computedFont = ''

/**
 * mesure given text's rendered width
 * @param text {string} text to measure
 */
const getTextWidth = text => {
  const context = textCanvas.getContext('2d')
  computedFont = computedFont || getFont()
  context.font = computedFont
  const metrics = context.measureText(text)
  return Math.ceil(metrics.width)
}

const getFullname = (t, name, yomi, apiId) => {
  const baseName = t(name)
  const fullName = t(name, { context: apiId && apiId.toString() })
  return (
    (fullName !== baseName && fullName) ||
    (['elite', 'flagship'].includes(yomi)
      ? `${baseName} ${_.capitalize(yomi)}`
      : baseName)
  )
}

const ShipName = withNamespaces('resources')(
  ({ name, yomi, apiId, enemy, t }) => {
    const translated = t(name)
    const fullname = getFullname(t, name, yomi, apiId)
    const length = getTextWidth(fullname)
    if (translated === name || !enemy || length < 120) {
      return <div className="ship-name">{fullname}</div>
    }

    const parts = fullname.split(' ')
    const up = []
    const down = []

    let isUpFull = false
    while (parts.length) {
      const word = parts.shift()
      // 0.618: let's be golden
      if (
        getTextWidth([...up, word].join(' ')) <= length * 0.618 &&
        !isUpFull
      ) {
        up.push(word)
      } else {
        isUpFull = true
        down.push(word)
      }
    }

    return (
      <div className={cls('ship-name', 'half')}>
        <span>{up.join(' ')}</span>
        <br />
        <span>{down.join(' ')}</span>
      </div>
    )
  },
)

ShipName.propTypes = {
  name: PropTypes.string,
  yomi: PropTypes.string,
  apiId: PropTypes.number,
  enemy: PropTypes.bool,
}

// fParam: [0]=火力, [1]=雷装, [2]=対空, [3]=装甲
const paramNames = ['firepower', 'torpedo', 'AA', 'armor']

const ShipView = compose(
  withNamespaces('resources'),
  connect((state, props) => {
    const api_ship_id = _.get(props.ship, 'raw.api_ship_id', -1)
    return {
      escapedPos: state.sortie.escapedPos || [],
      ship: props.ship,
      $ship: _.get(state, `const.$ships.${api_ship_id}`) || {},
      useFinalParam: _.get(state, 'config.plugin.prophet.useFinalParam', true),
      enableAvatar: _.get(state.config, 'plugin.prophet.showAvatar', false),
    }
  }),
)(
  ({
    ship,
    $ship,
    escapedPos,
    tooltipPos,
    useFinalParam,
    enableAvatar,
    compact,
    t,
  }) => {
    if (!(ship && ship.id > 0)) {
      return <div />
    }
    const isEscaped =
      _.includes(escapedPos, ship.pos - 1) && ship.owner === 'Ours'
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
          <div className="ship-name" style={{ borderBottom: '1px solid #666' }}>
            {getFullname(t, data.api_name, data.api_yomi, data.api_id)}
          </div>
          <div className="ship-essential">
            <span className="position-indicator">
              {ship.owner === 'Ours' ? '' : `ID ${ship.id}`}
            </span>
            <span>Lv. {data.api_lv || '-'}</span>

            <span>
              <FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} />
            </span>
            <span>
              <FABar icon={2} max={data.api_bull_max} now={data.api_bull} />
            </span>
          </div>
          <div className="ship-parameter">
            {paramNames.map(
              (name, idx) =>
                typeof param[idx] !== 'undefined' && (
                  <span key={name}>
                    <ParamIcon name={name} />
                    {param[idx]}
                  </span>
                ),
            )}
          </div>

          {// the key in ItemView uses index as a special case since it won't be reordered,
          // ignore this eslint warning
          (data.poi_slot || []).map(
            (item, i) =>
              item && (
                <ItemView
                  // eslint-disable-next-line
              key={i}
                  item={item}
                  extra={false}
                  warn={data.api_onslot[i] !== data.api_maxeq[i]}
                />
              ),
          )}

          <ItemView item={data.poi_slot_ex} extra label="+" warn={false} />
        </div>
      </Tooltip>
    )

    return (
      <div
        className={cls('div-row ship-item', {
          escaped: isEscaped,
          compact,
          avatar: enableAvatar,
        })}
      >
        <div className="ship-view">
          <OverlayTrigger placement={tooltipPos} overlay={tooltip}>
            <div className="ship-info" style={{ flexGrow: compact && 0 }}>
              <Fragment>
                {enableAvatar && (
                  <Avatar
                    mstId={data.api_ship_id}
                    height={30}
                    isDamaged={ship.nowHP <= ship.maxHP / 2}
                  />
                )}
                {(!enableAvatar || !compact) && (
                  <ShipName
                    name={data.api_name}
                    yomi={data.api_yomi}
                    apiId={data.api_id}
                  />
                )}
              </Fragment>
              <div
                className={`ship-damage no-pseudo ${
                  ship.isMvp ? getCondStyle(100) : ''
                }`}
              >
                {ship.isMvp ? <FontAwesome name="trophy" /> : ''}
                {isEscaped ? <FontAwesome name="reply" /> : ship.damage || 0}
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
  },
)

export default ShipView
