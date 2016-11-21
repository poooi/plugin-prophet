const __ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])

import {Panel} from 'react-bootstrap'
import React, { Component, PropTypes } from 'react'
import FontAwesome from 'react-fontawesome'


export class NextSpotInfo extends Component {
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