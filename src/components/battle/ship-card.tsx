import React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import styled, { css } from 'styled-components'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Tooltip, Avatar } from '../../host/poi-ui'
import { HPBar } from './hp-bar'
import { ShipTooltip } from './ship-tooltip'
import { getFullname, getTextWidth } from '../../utils/ship-name'
import type { ShipViewModel } from '../../battle/battle-view-model'
import type { PoiRootState } from '../../host/poi-types'

const ShipItem = styled.div<{ escaped?: boolean }>`
  opacity: ${(props) => props.escaped && 0.4};
  margin-bottom: 4px;
  height: 2.5em;
  max-height: 2.5em;
  display: flex;
`

const ShipContainer = styled.div`
  width: 50%;
  padding-right: 8px;
`

const ShipInfo = styled.div<{ compact?: boolean }>`
  flex: 1;
  flex-grow: ${({ compact }) => compact && 0};
  margin-right: auto;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
  position: relative;
`

const ShipHp = styled.div`
  width: 50%;
  white-space: nowrap;
  flex: 1;
`

const ShipNameContainer = styled.div<{ half?: boolean }>`
  flex: 1;
  padding-top: 3px;
  font-size: 1.25em;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ half }) =>
    half &&
    css`
      font-size: 0.9em;
      margin-top: -0.5em;
    `}
`

const ShipDamage = styled.div`
  white-space: nowrap;
  opacity: 0.8;
  text-align: right;
  margin-right: 0;
  margin-left: 1ex;
`

interface ShipNameProps {
  name: string
  yomi: string
  apiId: number
  enemy: boolean
}

const ShipName: React.FC<ShipNameProps> = ({ name, yomi, apiId, enemy }) => {
  const { t } = useTranslation('resources')
  const translated = t(name)
  const fullname = getFullname(t, name, yomi, apiId)
  const length = getTextWidth(fullname)

  if (translated === name || !enemy || length < 120) {
    return <ShipNameContainer>{fullname}</ShipNameContainer>
  }

  const parts = fullname.split(' ')
  const up: string[] = []
  const down: string[] = []
  let isUpFull = false

  while (parts.length > 0) {
    const word = parts.shift()!
    if (getTextWidth([...up, word].join(' ')) <= length * 0.618 && !isUpFull) {
      up.push(word)
    } else {
      isUpFull = true
      down.push(word)
    }
  }

  return (
    <ShipNameContainer half>
      <span>{up.join(' ')}</span>
      <br />
      <span>{down.join(' ')}</span>
    </ShipNameContainer>
  )
}

interface ShipCardOwnProps {
  ship: ShipViewModel
  compact?: boolean
  tooltipPos?: string
  rawData?: Record<string, unknown>
}

interface ShipCardStateProps {
  $ship: Record<string, unknown>
  useFinalParam: boolean
  enableAvatar: boolean
  escapedPos: number[]
}

const ShipCardInner: React.FC<ShipCardOwnProps & ShipCardStateProps> = ({
  ship,
  compact,
  tooltipPos = 'left',
  rawData,
  $ship,
  useFinalParam,
  enableAvatar,
  escapedPos,
}) => {
  if (!ship || ship.id <= 0) return <div />

  const isEscaped = escapedPos.includes(ship.position - 1) && ship.owner === 'Ours'
  const mergedData = { ...$ship, ...rawData }

  const tooltip = (
    <ShipTooltip
      ship={{ ...ship, params: useFinalParam ? ship.params : ship.params ? { ...ship.params, isFinal: false } : null }}
      rawData={mergedData as ShipCardOwnProps['rawData']}
    />
  )

  return (
    <ShipItem
      escaped={isEscaped}
      className={classnames('ship-item', {
        escaped: isEscaped,
        compact,
        avatar: enableAvatar,
      })}
    >
      <ShipContainer>
        <Tooltip
          wrapperTagName="div"
          targetTagName="div"
          position={tooltipPos}
          content={tooltip}
        >
          <ShipInfo compact={compact}>
            <>
              {enableAvatar && (
                <Avatar
                  mstId={ship.id}
                  height={30}
                  isDamaged={ship.hp.now <= ship.hp.max / 2}
                />
              )}
              {(!enableAvatar || !compact) && (
                <ShipName
                  name={ship.name}
                  yomi={ship.yomi}
                  apiId={ship.id}
                  enemy={ship.owner === 'Enemy'}
                />
              )}
              {ship.isMvp && <ShipDamage>MVP</ShipDamage>}
            </>
          </ShipInfo>
        </Tooltip>
      </ShipContainer>
      <ShipHp>
        <HPBar
          max={ship.hp.max}
          from={ship.hp.init}
          to={ship.hp.now}
          damage={ship.damage}
          stage={ship.hp.stage}
          item={ship.useItemId}
          cond={ship.cond}
        />
      </ShipHp>
    </ShipItem>
  )
}

export const ShipCard = connect(
  (state: PoiRootState, props: ShipCardOwnProps): ShipCardStateProps => ({
    escapedPos: state.sortie?.escapedPos ?? [],
    $ship: (get(state, `const.$ships.${props.ship.id}`) as Record<string, unknown>) ?? {},
    useFinalParam: get(state, 'config.plugin.prophet.useFinalParam', true) as boolean,
    enableAvatar: get(state, 'config.plugin.prophet.showAvatar', false) as boolean,
  }),
)(ShipCardInner)
