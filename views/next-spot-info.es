import React from 'react'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { resolve } from 'path'

import { extensionSelectorFactory } from 'views/utils/selectors'

import { PLUGIN_KEY, _t, spotIcon } from '../utils'

const __ = window.i18n['poi-plugin-prophet'].__.bind(window.i18n['poi-plugin-prophet'])

const getCompassAngle = (mapspots, maproutes, currentNode) => {
  if (currentNode == -1) return NaN
  if (!mapspots || !Object.keys(mapspots).length) return NaN
  if (!maproutes || !Object.keys(maproutes).length) return NaN

  const last = get(mapspots, (maproutes[currentNode] || [])[0], [])
  const next = get(mapspots, (maproutes[currentNode] || [])[1], [])
  if (!last || !next || !Object.keys(last).length || !Object.keys(next).length) return NaN

  return ((Math.atan2(next[1] - last[1], next[0] - last[0]) / Math.PI) * 180) + 90
}

const SpotIcon = ({ spotKind }) => {
  if (typeof spotIcon[spotKind] === 'undefined') {
    return ''
  }
  const iconPath = resolve(__dirname, `../assets/icons/spot/${spotIcon[spotKind]}.svg`)
  return (
    <span className="param-icon"><img src={iconPath} className="svg prophet-icon spot-icon" /></span>
  )
}


const NextSpotInfo = connect(
  (state, props) => {
    const sortie = state.sortie || {}
    const { sortieMapId, currentNode } = sortie
    const spot = `${sortieMapId}-${currentNode}`
    const showLastFormation = get(state, 'config.plugin.prophet.showLastFormation', true)

    return {
      currentNode: currentNode || -1,
      sortieMapId: parseInt(sortieMapId || 0),
      allMaps: get(state, 'fcd.map', {}),
      spotKind: props.spotKind || '?',
      lastFormation: showLastFormation && get(extensionSelectorFactory(PLUGIN_KEY)(state), `${spot}.fFormation`),
    }
  }
)(({ currentNode, sortieMapId, allMaps, spotKind, lastFormation }) => {
  const mapspots = get(allMaps, `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.spots`, {})
  const maproutes = get(allMaps, `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.route`, {})
  const compassAngle = getCompassAngle(mapspots, maproutes, currentNode)
  const nextSpot = get(maproutes, `${currentNode}.1`, '?')
  // svg arrow's default angle is 135 deg
  return (
    <span className="next-spot-info">
      <span>
        {`${__('Compass Point')}: `}
        <span className="compass">
          {
          Number.isNaN(compassAngle) ?
          '?' :
          <span className="svg" id="prophet-compass">
            <img
              src={resolve(__dirname, `../assets/icons/compass-arrow-${window.isDarkTheme ? 'dark' : 'light'}.svg`)}
              style={{ transform: `rotate(${compassAngle - 135}deg)` }} className="svg prophet-icon"
            />
          </span>
        }
        </span>
        <span>
          {` | ${nextSpot} (${currentNode}) : `}
          <SpotIcon spotKind={spotKind} />
          {__(spotKind)}
        </span>
      </span>
      <span>
        {lastFormation && `${__('Last chosen: ')}${_t(lastFormation)}`}
      </span>
    </span>
  )
})

export default NextSpotInfo
