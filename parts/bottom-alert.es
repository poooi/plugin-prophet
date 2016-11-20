const __ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])

import {Panel} from 'react-bootstrap'
import React, { Component, PropTypes } from 'react'
import FontAwesome from 'react-fontawesome'

// drop info
class DropAlert extends Component {
  static propTypes = {
    getItem: PropTypes.string,
    getShip: PropTypes.shape({
      api_ship_type: PropTypes.string,
      api_ship_name: PropTypes.string,
    }),
  }

  static defaultProps = {
    getItem: '',
    getShip: {
      api_ship_type: '',
      api_ship_name: '',
    },
  }

  render(){
    const {getItem, getShip} = this.props
    const {api_ship_type, api_ship_name} = getShip
    let messages = []

    if (getItem) messages.push(__("Item get"), window.i18n.resources.__(getItem))
    if (api_ship_name) messages.push(
      __("Join fleet",
      window.i18n.resources.__(api_ship_type),
      window.i18n.resources.__(api_ship_name))
    )
    return <span>{messages.join(" ")}</span>
  }
}

// info during battle
class BattleAlert extends Component {
  static propTypes = {
    result: PropTypes.string.isRequired,
    formation: PropTypes.string.isRequired,
    intercept: PropTypes.string.isRequired,
    seiku: PropTypes.string.isRequired,
  }

  static defaultProps = {
    result: '',
    formation: '',
    intercept: '',
    seiku: '',
  }

  render(){
    const {result, formation, intercept, seiku} = this.props
    return <span>{`${result} | ${formation} | ${intercept} | ${seiku}`}</span>
  }
}

class NextSpotAlert extends Component {
  static propTypes = {
    nextSpot: PropTypes.string.isRequired,
    nextSpotInfo: PropTypes.string.isRequired,
    compassPoint: PropTypes.string.isRequired,
    compassAngle: PropTypes.number.isRequired,
  }

  static defaultProps = {
    nextSpot: '',
    nextSpotInfo: '',
    compassPoint: '',
    compassAngle: NaN,
  }

  render() {
    const {nextSpot, compassPoint, nextSpotInfo, compassAngle} = this.props
    return(
      <span>
        {`${compassPoint}: `}
        <span className="compass">
          {Number.isNaN(compassAngle) ? 
            '?' : 
            <FontAwesome name='location-arrow' fixedWidth={true} className='compass-arrow'
                             style={{transform: `rotate(${compassAngle - 45}deg)"`}} />
          }
        </span>
        {` | ${nextSpot}: ${nextSpotInfo}`}
      </span>
    )
  }
}

// BottomAlert might be splited to 3 Alerts
export default class BottomAlert extends Component{
  render() {
    console.log('ES6-BottomAlert')
    let alert = ''
    switch(true){
    case(this.props.getShip != null || this.props.getItem):
      alert = <DropAlert getShip={this.props.getShip} getItem={this.props.getItem} />
      break
    case(this.props.formationNum != 0):
      alert = <BattleAlert 
                result = {this.props.result} 
                formation = {this.props.formation} 
                intercept = {this.props.intercept} 
                seiku = {this.props.seiku}
              />
      break
    case(!!this.props.nextSpotInfo):
      alert = <NextSpotAlert
                nextSpot = {this.props.nextSpot} 
                nextSpotInfo = {this.props.nextSpotInfo} 
                compassPoint = {this.props.compassPoint} 
                compassAngle = {this.props.compassAngle}
              />
      break
    }
    
    return(
      <div className="bottom-alert">
        { alert }
      </div>
      )
  }
}

