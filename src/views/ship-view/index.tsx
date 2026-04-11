import React, { FC } from 'react'
import FontAwesome from 'react-fontawesome'
import { Tooltip } from 'views/components/etc/overlay'
import { useSelector } from 'react-redux'
import _ from 'lodash'
import { getCondStyle } from 'views/utils/game-utils'
import { Avatar } from 'views/components/etc/avatar'
import cls from 'classnames'
import styled from 'styled-components'
import type { Ship } from 'poi-lib-battle'
import type { APIMstShip } from 'kcsapi/api_start2/getData/response'

import { ShipItem, ShipContainer, ShipHp, ShipInfo } from '../common-styled'
import { HPBar } from '../bar'
import { ShipName } from './ship-name'
import { TooltipContent } from './tooltip-content'
import type { FriendShipRaw } from './types'

const ShipDamage = styled.div<{ compact?: boolean }>`
  white-space: nowrap;
  opacity: 0.8;
  text-align: right;
  margin-right: 0;
  margin-left: 1ex;

  &::after {
    display: none;
  }
`

interface ShipViewProps {
  ship: Ship
  tooltipPos?: string
  compact?: boolean
}

const ShipView: FC<ShipViewProps> = ({ ship, tooltipPos, compact }) => {
  const raw = ship.raw as FriendShipRaw | null | undefined
  const api_ship_id = raw?.api_ship_id ?? -1
  const escapedPos = useSelector((state: PoiRootState) => state.sortie.escapedPos ?? [])
  const $ship = useSelector((state: PoiRootState) => state.const?.$ships?.[api_ship_id] ?? null)
  const useFinalParam = useSelector((state: PoiRootState) =>
    state.config?.plugin?.prophet?.useFinalParam ?? true,
  )
  const enableAvatar = useSelector((state: PoiRootState) =>
    state.config?.plugin?.prophet?.showAvatar ?? false,
  )

  if (!(ship && ship.id > 0)) return <div />

  const isEscaped = _.includes(escapedPos, ship.pos - 1) && ship.owner === 'Ours'
  const data: FriendShipRaw = { ...($ship ?? ({} as APIMstShip)), ...(raw ?? {}) }

  if (!data.api_maxeq) data.api_maxeq = []
  if (!data.api_onslot) data.api_onslot = data.api_maxeq

  const tooltip = <TooltipContent data={data} ship={ship} useFinalParam={useFinalParam} />

  return (
    <ShipItem
      escaped={isEscaped}
      className={cls('ship-item', { escaped: isEscaped, compact, avatar: enableAvatar })}
    >
      <ShipContainer>
        <Tooltip
          wrapperTagName="div"
          targetTagName="div"
          position={tooltipPos as never}
          content={tooltip}
        >
          <ShipInfo compact={compact}>
            <>
              {enableAvatar && (
                <Avatar
                  mstId={data.api_ship_id ?? api_ship_id}
                  height={30}
                  isDamaged={ship.nowHP <= ship.maxHP / 2}
                />
              )}
              {(!enableAvatar || !compact) && (
                <ShipName
                  name={data.api_name}
                  yomi={data.api_yomi}
                  apiId={data.api_id ?? 0}
                />
              )}
            </>
            <ShipDamage
              compact={compact}
              className={ship.isMvp ? getCondStyle(100) : ''}
            >
              {ship.isMvp ? <FontAwesome name="trophy" /> : ''}
              {isEscaped ? <FontAwesome name="reply" /> : ship.damage || 0}
            </ShipDamage>
          </ShipInfo>
        </Tooltip>
      </ShipContainer>
      <ShipHp>
        <HPBar
          max={ship.maxHP}
          from={ship.initHP}
          to={ship.nowHP}
          damage={ship.lostHP}
          stage={ship.stageHP}
          item={ship.useItem ?? undefined}
          cond={data.api_cond}
        />
      </ShipHp>
    </ShipItem>
  )
}

export default ShipView
