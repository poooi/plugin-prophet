import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import _ from 'lodash'
import { resolve } from 'path'
import { getCondStyle, getHpStyle } from 'views/utils/game-utils'
import { Avatar } from 'views/components/etc/avatar'
import { isKana } from 'wanakana'
import cls from 'classnames'

import ItemView from './item-view'
import { FABar, HPBar } from './bar'

// const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

const ParamIcon = ({ name = '' }) => {
  const iconPath = resolve(__dirname, `../assets/icons/${name}.svg`)
  return <span className="param-icon"><img src={iconPath} className="svg prophet-icon" alt={name} /></span>
}

ParamIcon.propTypes = {
  name: PropTypes.string,
}

const ShipName = ({ name, yomi, enemy }) => {
  const translated = window.i18n.resources.__(name)
  const fullname = ['elite', 'flagship'].includes(yomi)
    ? `${translated} ${yomi}`
    : translated
  if (translated === name || !enemy || fullname.length < 20) {
    return <div className="ship-name">{fullname}</div>
  }

  const parts = fullname.split(' ')
  const up = []
  const down = []

  const length = _(parts).map(_.size).sum()

  while (parts.length) {
    const word = parts.shift()
    if (up.join(' ').length + word.length < (length / 2)) {
      up.push(word)
    } else {
      down.push(word)
    }
  }

  return (
    <div className="ship-name" style={{ fontSize: '12px', lineHeight: '12px' }}>
      <span>{up.join(' ')}</span>
      <br />
      <span>{down.join(' ')}</span>
    </div>
  )
}

const getAvatarChar = (name) => {
  if (name.includes('姫')) {
    return (
      <svg
        aria-hidden="true"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width="13"
      >
        <path
          fill="currentColor"
          d="M436 512H76c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h360c6.627 0 12 5.373 12 12v24c0 6.627-5.373 12-12 12zM255.579 0c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zm204.568 154.634c-5.768-3.045-12.916-.932-16.082 4.77-8.616 15.516-22.747 37.801-44.065 37.801-28.714 0-30.625-19.804-31.686-57.542-.183-6.492-5.501-11.664-11.995-11.664h-41.006c-5.175 0-9.754 3.328-11.388 8.238-8.89 26.709-26.073 40.992-47.925 40.992s-39.034-14.283-47.925-40.992c-1.634-4.91-6.213-8.238-11.388-8.238h-41.005c-6.495 0-11.813 5.174-11.995 11.667-1.052 37.642-2.934 57.539-31.688 57.539-20.691 0-33.817-20.224-44.425-38.025-3.266-5.48-10.258-7.431-15.899-4.453l-39.179 20.679a12 12 0 0 0-5.51 15.145L112 448h288l105.014-257.448a12 12 0 0 0-5.51-15.145l-39.357-20.773z"
        />
      </svg>
    )
  }
  if (name.includes('PT')) {
    return 'PT'
  }
  if (name.includes('鬼')) {
    return '鬼'
  }
  return name.split('').find(c => isKana(c)) || ''
}

const EnemyAvatar = ({ name, nowHP, maxHP }) => (
  <div
    className={`progress-bar-${nowHP > 0 ? getHpStyle((100 * nowHP) / maxHP) : 'grey'}`}
    style={{
      width: 30,
      height: 30,
      lineHeight: '30px',
      textAlign: 'center',
      marginRight: '0.5ex',
    }}
  >
    {getAvatarChar(name)}
  </div>
)

ShipName.propTypes = {
  name: PropTypes.string,
  yomi: PropTypes.string,
  enemy: PropTypes.bool,
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
      ourAvatar: _.get(state.config, 'plugin.prophet.showAvatar', false),
      enemyAvatar: _.get(state.config, 'plugin.prophet.showVesselAvatar', false),
    }
  }
)(({
  ship, $ship, escapedPos, layout, reverseLayout, useFinalParam, ourAvatar, enemyAvatar, compact,
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
        <div className="ship-name" style={{ borderBottom: '1px solid #666' }}>
          {
            ['elite', 'flagship'].includes(data.api_yomi)
              ? `${window.i18n.resources.__(data.api_name)} ${data.api_yomi}`
              : window.i18n.resources.__(data.api_name)
          }
        </div>
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
    <div
      className={cls('div-row ship-item', {
        escaped: isEscaped,
        compact,
        avatar: data.api_sortno ? ourAvatar : enemyAvatar,
      })}
    >
      <div className="ship-view">
        <OverlayTrigger
          placement={placements[parseInt(`${+(layout === 'vertical')}${+(reverseLayout)}`, 2)]}
          overlay={tooltip}
        >
          <div className="ship-info" style={{ flexGrow: compact && 0 }}>
            {
              data.api_sortno ?
                <Fragment>
                  {
                    ourAvatar &&
                    <Avatar
                      mstId={data.api_ship_id}
                      height={30}
                      isDamaged={ship.nowHP <= ship.maxHP / 2}
                    />
                  }
                  {
                    (!ourAvatar || !compact) &&
                    <ShipName
                      name={data.api_name}
                      yomi={data.api_yomi}
                    />
                  }
                </Fragment>
                :
                <Fragment>
                  {
                    enemyAvatar &&
                    <EnemyAvatar
                      name={data.api_name}
                      nowHP={ship.nowHP}
                      maxHP={ship.maxHP}
                    />
                  }
                  {
                    (!enemyAvatar || !compact) &&
                    <ShipName
                      name={data.api_name}
                      yomi={data.api_yomi}
                      enemy
                    />
                  }
                </Fragment>
            }
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
