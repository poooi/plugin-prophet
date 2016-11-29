import React, { Component } from 'react'
import { HPBar } from './bar'


const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

// maybe can use compose for co-exist with redux connect

const order = {
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
}

const actionKind = {
  '0': 'Standby',
  '1': 'Sortie',
  '2': 'Air Defense',
  '3': 'Retreat',
  '4': 'Rest',
}

// TODO: connect store airbase
class SquadView extends Component {


  render() {
    let {child: ship} = this.props
    if (ship && ship.id > 0) {
      return <div />
    }
    let pos = ship.pos || 0

    let name = ship.raw.api_name || `${order[pos] || ''} Squadron`
    let action_kind = ship.raw.api_action_kind


    return (
      <div className="div-row ship-item">
        <div className={"ship-view "+ (this.props.compact? "compact" : '')}>
          <div className="ship-info">
            <div className='ship-name'>
              <span>
                {`${name} [${__(actionKind[action_kind] || '')}]`}
              </span>
            </div>
          </div>
        </div>
        <div className='ship-hp'>
          <HPBar max={ship.maxHP} from={ship.initHP} to={ship.nowHP} damage={ship.lostHP} />
        </div>
      </div>
    )
  }
}

export default SquadView
