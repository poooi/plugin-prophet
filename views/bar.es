import React from 'react'
import PropTypes from 'prop-types'
import { getCondStyle, getHpStyle } from 'views/utils/game-utils'
import { MaterialIcon, SlotitemIcon } from 'views/components/etc/icon'
import { connect } from 'react-redux'
import { get } from 'lodash'
import styled from 'styled-components'

export const FABar = ({ max, now, icon }) => {
  let pcnt
  if (!(max && now) && now !== 0) {
    pcnt = 100
  } else {
    pcnt = Math.round((100 * now) / max)
  }

  return (
    <span className="fa-bar">
      <MaterialIcon materialId={icon} className="prophet-icon" />
      {`${pcnt}%`}
    </span>
  )
}

const HpIndicator = styled.div`
  position: absolute;
  border-left: black 1px solid;
  height: 4px;
  z-index: 1000;
  left: ${(props) => `${25 * props.idx}%`};
  opacity: ${(props) => props.opacity};
`

const ProgressBar = styled.div`
  flex-direction: row;
  display: flex;
  border-radius: 40px;
  background-color: transparent;
  border: 0.5px solid #30404d30;
  width: 100%;
  height: 8px;
  position: relative;
  overflow: hidden;
`

const Progress = styled.div`
  background-color: ${({ intent, theme }) => {
    if (intent === 'gray') {
      return theme === 'dark' ? '#5c7080' : '#e1e8ed'
    }
    return `var(--poi-${intent})`
  }};
  height: 8px;
  width: ${({ value }) => `${value}%`};
  transition: width 0.5s cubic-bezier(0.445, 0.05, 0.55, 0.95);
`

FABar.propTypes = {
  max: PropTypes.number,
  now: PropTypes.number,
  icon: PropTypes.number,
}

export const HPBar = connect((state, props) => ({
  showScale: get(state, 'config.plugin.prophet.showScale', true),
  $equip: get(state, `const.$equips.${props.item}`),
  theme: get(state, 'config.poi.appearance.theme', 'dark'),
}))(
  ({ max, from, to, damage, stage, item, cond, $equip, showScale, theme }) => {
    const _from = Math.min(Math.max(0, from), max)
    const _to = Math.min(Math.max(0, to), max)
    const _stage = stage == null ? _from : stage
    const now = 100 * (_to / max)
    const lost = 100 * ((_stage - _to) / max)

    const loss = Math.max(_from - _stage, 0) - damage

    return (
      <div>
        <div className="ship-stat">
          <div className="div-row">
            <span className="ship-hp">
              {_to} / {max}
              {_stage !== 0 && loss !== 0 && (
                <span className="loss">{loss}</span>
              )}
              {!!item && $equip && (
                <span className="item-icon">
                  <SlotitemIcon
                    slotitemId={$equip.api_type[3]}
                    className="prophet-icon"
                  />
                </span>
              )}
            </span>
            {typeof cond !== 'undefined' ? (
              <div className="status-cond">
                <span className={`ship-cond ${getCondStyle(cond)}`}>
                  ★{cond}
                </span>
              </div>
            ) : (
              <noscript />
            )}
          </div>
          <ProgressBar>
            <Progress intent={getHpStyle(now)} value={now} />
            <Progress intent="gray" value={lost} theme={theme} />
            {[1, 2, 3].map((i) => (
              <HpIndicator
                key={i}
                idx={i}
                opacity={now + lost > 25 * i && showScale ? 0.75 : 0}
              />
            ))}
          </ProgressBar>
        </div>
      </div>
    )
  },
)
