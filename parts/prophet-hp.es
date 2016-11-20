import React, { Component, PropTypes } from 'react'
import {Table, ProgressBar, Grid, Input, Col, Alert, Button} from 'react-bootstrap'

import {Ship} from '../models'

const getHpStyle = (percent) => {
  switch(true){
  case (percent <= 25):
    return 'danger'
  case (percent <= 50):
    return 'warning'
  case (percent <= 75):
    return 'info'
  default:
    return 'success'
  }
}

const getLineStyle = (flag) => {
  return (flag ?  'friend-hp': 'enemy-hp')
}

export default class ProphetHp extends Component {
  static propTypes = {
    ship: PropTypes.instanceOf(Ship).isRequired,
  }
  // instanceOf will always give warning currently

  static defaultProps = {
    ship: new Ship(),
  }

  render() {
    const {ship} = this.props
    let text = ship.hp.injure > 0 ? 
      `${ship.hp.now} / ${ship.hp.max} (-${ship.hp.injure})` : 
      `${ship.hp.now} / ${ship.hp.max}`
    let label = <div style={{position: 'absolute', width: '100%'}}>{text}</div>

    return(
      <div className="hp-progress" style={ship.id == -1 ? {} : {opacity: 1 - 0.6 * ship.back}}>
      {
        ship.id == -1 ? '' : 
        <div className={getLineStyle (ship.owner != 1 && (ship.hp.now * 4 - ship.hp.max > 0))}>
          <ProgressBar bsStyle={getHpStyle (ship.hp.now / ship.hp.max * 100)}
            now={ship.hp.now / ship.hp.max * 100}
            label={label} />
          <div className='red-line' />
        </div>

      }
      </div>
    )
  }
}

