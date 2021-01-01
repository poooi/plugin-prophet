import React from 'react'
import PropTypes from 'prop-types'
import { withNamespaces } from 'react-i18next'

import { HPBar } from './bar'
import { ShipItem, ShipHp, ShipContainer, ShipInfo } from './common-styled'

// maybe can use compose for co-exist with redux connect

const order = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

const actionKind = {
  0: 'Standby',
  1: 'Sortie',
  2: 'Air Defense',
  3: 'Retreat',
  4: 'Rest',
}

// TODO: connect store airbase
const SquadView = withNamespaces('poi-plugin-prophet')(
  ({ ship, compact, t }) => {
    if (ship && ship.id > 0) {
      return <div />
    }
    const pos = ship.pos || 0

    const name = ship.raw.api_name || `${order[pos] || ''} Squadron`
    const action_kind = ship.raw.api_action_kind

    return (
      <ShipItem className="ship-item">
        <ShipContainer>
          <ShipInfo compact={compact}>
            <div className="ship-name">
              <span>{`${name} [${t(actionKind[action_kind] || '')}]`}</span>
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
  },
)

SquadView.propTypes = {
  ship: PropTypes.shape({
    pos: PropTypes.number,
    raw: PropTypes.object,
    id: PropTypes.number,
  }),
  compact: PropTypes.bool,
}

export default SquadView
