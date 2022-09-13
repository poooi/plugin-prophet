import React from 'react'
import PropTypes from 'prop-types'
import { getCondStyle, getHpStyle } from 'views/utils/game-utils'
import {
  MaterialIcon as MatrialIconBase,
  SlotitemIcon,
} from 'views/components/etc/icon'
import { connect } from 'react-redux'
import { get } from 'lodash'
import styled from 'styled-components'

const MaterialIcon = styled(MatrialIconBase)`
  height: 16px;
  width: 16px;
`

const BarContainer = styled.span`
  display: flex;
`

export const FABar = ({ max, now, icon }) => {
  let pcnt
  if (!(max && now) && now !== 0) {
    pcnt = 100
  } else {
    pcnt = Math.round((100 * now) / max)
  }

  return (
    <BarContainer>
      <MaterialIcon materialId={icon} />
      {`${pcnt}%`}
    </BarContainer>
  )
}

FABar.propTypes = {
  max: PropTypes.number,
  now: PropTypes.number,
  icon: PropTypes.number,
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
const ShipData = styled.div`
  display: flex;
`

const Loss = styled.span`
  margin-left: 1ex;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;

  ::before {
    content: '(';
  }

  ::after {
    content: ')';
  }
`

const HP = styled.span``

const UseItem = styled.span`
  img {
    width: 20px;
    height: 20px;
  }
`

const Condition = styled.span`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
`

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
      <>
        <ShipData>
          <HP>
            {_to} / {max}
          </HP>
          {_stage !== 0 && loss !== 0 && <Loss>{loss}</Loss>}
          {!!item && $equip && (
            <UseItem>
              <SlotitemIcon slotitemId={$equip.api_type[3]} />
            </UseItem>
          )}
          {typeof cond !== 'undefined' && (
            <Condition className={getCondStyle(cond)}>★{cond}</Condition>
          )}
        </ShipData>
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
      </>
    )
  },
)
