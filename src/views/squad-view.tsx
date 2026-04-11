import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import type { Ship } from 'poi-lib-battle'

import { HPBar } from './bar'
import { ShipItem, ShipHp, ShipContainer, ShipInfo } from './common-styled'

const order: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

const actionKind: Record<number, string> = {
  0: 'Standby',
  1: 'Sortie',
  2: 'Air Defense',
  3: 'Retreat',
  4: 'Rest',
}

interface SquadViewProps {
  ship: Ship
  compact?: boolean
}

const SquadView: FC<SquadViewProps> = ({ ship, compact }) => {
  const { t } = useTranslation('poi-plugin-prophet')

  if (ship && ship.id > 0) {
    return <div />
  }
  const pos = ship.pos || 0
  const raw = ship.raw as { api_name?: string; api_action_kind?: number } | null | undefined
  const name = raw?.api_name ?? `${order[pos] ?? ''} Squadron`
  const action_kind = raw?.api_action_kind ?? 0

  return (
    <ShipItem className="ship-item">
      <ShipContainer>
        <ShipInfo compact={compact}>
          <div className="ship-name">
            <span>{`${name} [${t(actionKind[action_kind] ?? '')}]`}</span>
          </div>
        </ShipInfo>
      </ShipContainer>
      <ShipHp>
        <HPBar
          max={ship.maxHP}
          from={ship.initHP}
          to={ship.nowHP}
          damage={ship.lostHP}
        />
      </ShipHp>
    </ShipItem>
  )
}

export default SquadView
