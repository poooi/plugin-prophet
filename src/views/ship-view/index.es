import React, { Fragment } from 'react'
import FontAwesome from 'react-fontawesome'
import { Tooltip } from 'views/components/etc/overlay'
import { connect } from 'react-redux'
import _ from 'lodash'
import { getCondStyle } from 'views/utils/game-utils'
import { Avatar } from 'views/components/etc/avatar'
import cls from 'classnames'
import { withNamespaces } from 'react-i18next'
import { compose } from 'redux'
import styled from 'styled-components'

import { ShipItem, ShipContainer, ShipHp, ShipInfo } from '../common-styled'
import { HPBar } from '../bar'
import { ShipName } from './ship-name'
import { TooltipContent } from './tooltip-content'

const ShipDamage = styled.div`
  white-space: nowrap;
  opacity: 0.8;
  text-align: right;
  margin-right: 0;
  margin-left: 1ex;

  ::after {
    display: none;
  }
`

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

    const tooltip = (
      <TooltipContent data={data} ship={ship} useFinalParam={useFinalParam} />
    )

    return (
      <ShipItem
        escaped={isEscaped}
        className={cls('ship-item', {
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
            item={ship.useItem}
            cond={data.api_cond}
          />
        </ShipHp>
      </ShipItem>
    )
  },
)

export default ShipView
