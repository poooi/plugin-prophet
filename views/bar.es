import React from 'react'
import PropTypes from 'prop-types'
import { getCondStyle, getHpStyle } from 'views/utils/game-utils'
import { MaterialIcon, SlotitemIcon } from 'views/components/etc/icon'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { ProgressBar, Label } from 'react-bootstrap'

export const FABar = ({ max, now, icon }) => {
  let pcnt
  if (!(max && now)) {
    pcnt = 100
  } else {
    pcnt = Math.round(100 * now / max)
  }

  return (
    <span className="fa-bar">
      <MaterialIcon materialId={icon} className="prophet-icon" />
      {`${pcnt}%`}
    </span>
  )
}

FABar.propTypes = {
  max: PropTypes.number,
  now: PropTypes.number,
  icon: PropTypes.number,
}

export const HPBar = connect((state, props) => ({
  showScale: get(state, 'config.plugin.prophet.showScale', true),
  $equip: get(state, `const.$equips.${props.item}`),
}))(({ max, from, to, damage, stage, item, cond, $equip, showScale }) => {
  const _from = Math.min(Math.max(0, from), max)
  const _to = Math.min(Math.max(0, to), max)
  const _stage = stage == null ? _from : stage
  const now = 100 * (_to / max)
  const lost = 100 * ((_stage - _to) / max)

  return (
    <div>
      <div className="ship-stat">
        <div className="div-row">
          <span className="ship-hp">
            {_to} / {max}
            {_stage !== 0 &&
              Math.max(_from - _stage, 0) - damage !== 0 && (
                <Label bsStyle="danger">
                  {Math.max(_from - _stage, 0) - damage}
                </Label>
              )}
            {!!item &&
              $equip && (
                <Label bsStyle="danger">
                  <span className="item-icon">
                    <SlotitemIcon
                      slotitemId={$equip.api_type[3]}
                      className="prophet-icon"
                    />
                  </span>
                </Label>
              )}
          </span>
          {typeof cond !== 'undefined' ? (
            <div className="status-cond">
              <span className={`ship-cond ${getCondStyle(cond)}`}>★{cond}</span>
            </div>
          ) : (
            <noscript />
          )}
        </div>
        <span className="hp-progress top-space">
          <ProgressBar className="hp-bar">
            <ProgressBar
              bsStyle={getHpStyle(now)}
              className="hp-bar"
              now={now}
            />
            <ProgressBar className="hp-bar lost" now={lost} />
          </ProgressBar>
          {[1, 2, 3].map(i => (
            <div
              className="hp-indicator"
              key={i}
              style={{
                left: `-${25 * i}%`,
                opacity: now + lost > 100 - 25 * i && showScale ? 0.75 : 0,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  )
})
