import React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import styled from 'styled-components'
import { SlotitemIcon, getHpStyle, getCondStyle } from '../../host/poi-ui'
import type { PoiRootState } from '../../host/poi-types'

const ShipData = styled.div`
  display: flex;
`

const HP = styled.span``

const Loss = styled.span`
  margin-left: 1ex;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;

  &::before {
    content: '(';
  }

  &::after {
    content: ')';
  }
`

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

const HpIndicator = styled.div<{ idx: number; opacity: number }>`
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

const Progress = styled.div<{ intent: string; value: number; theme?: string }>`
  background-color: ${({ intent, theme: t }) => {
    if (intent === 'gray') {
      return t === 'dark' ? '#5c7080' : '#e1e8ed'
    }
    return `var(--poi-${intent})`
  }};
  height: 8px;
  width: ${({ value }) => `${value}%`};
  transition: width 0.5s cubic-bezier(0.445, 0.05, 0.55, 0.95);
`

interface HPBarOwnProps {
  max: number
  from: number
  to: number
  damage: number
  stage?: number | null
  item?: number | null
  cond?: number
}

interface HPBarStateProps {
  showScale: boolean
  $equip: { api_type: number[] } | undefined
  theme: string
}

const HPBarInner: React.FC<HPBarOwnProps & HPBarStateProps> = ({
  max,
  from,
  to,
  damage,
  stage,
  item,
  cond,
  $equip,
  showScale,
  theme,
}) => {
  const _from = Math.min(Math.max(0, from), max)
  const _to = Math.min(Math.max(0, to), max)
  const _stage = stage == null ? _from : stage
  const now = (100 * _to) / max
  const lost = (100 * (_stage - _to)) / max

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
        <Progress intent={getHpStyle(_to, max)} value={now} />
        <Progress intent="gray" value={lost} theme={theme} />
        {([1, 2, 3] as const).map((i) => (
          <HpIndicator
            key={i}
            idx={i}
            opacity={now + lost > 25 * i && showScale ? 0.75 : 0}
          />
        ))}
      </ProgressBar>
    </>
  )
}

export const HPBar = connect((state: PoiRootState, props: HPBarOwnProps): HPBarStateProps => ({
  showScale: get(state, 'config.plugin.prophet.showScale', true) as boolean,
  $equip: props.item != null ? get(state, `const.$equips.${props.item}`) as { api_type: number[] } | undefined : undefined,
  theme: get(state, 'config.poi.appearance.theme', 'dark') as string,
}))(HPBarInner)
