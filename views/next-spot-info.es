import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { resolve } from 'path'
import { withNamespaces } from 'react-i18next'
import { compose } from 'redux'

import { extensionSelectorFactory } from 'views/utils/selectors'
import { MaterialIcon } from 'views/components/etc/icon'

import {
  PLUGIN_KEY,
  _t,
  spotIcon,
  spotInfo,
  getSpotKind,
  getSpotMessage,
} from '../utils'

const getCompassAngle = (mapspots, maproutes, currentNode) => {
  if (currentNode === -1) return NaN
  if (!mapspots || !Object.keys(mapspots).length) return NaN
  if (!maproutes || !Object.keys(maproutes).length) return NaN

  const last = get(mapspots, (maproutes[currentNode] || [])[0], [])
  const next = get(mapspots, (maproutes[currentNode] || [])[1], [])
  if (!last || !next || !Object.keys(last).length || !Object.keys(next).length)
    return NaN

  return (Math.atan2(next[1] - last[1], next[0] - last[0]) / Math.PI) * 180 + 90
}

const SpotIcon = ({ spotKind }) => {
  if (typeof spotIcon[spotKind] === 'undefined') {
    return <span>{/* empty */}</span>
  }
  const iconPath = resolve(
    __dirname,
    `../assets/icons/spot/${spotIcon[spotKind]}.svg`,
  )
  return (
    <span className="param-icon">
      <img src={iconPath} className="svg prophet-icon spot-icon" alt="spot" />
    </span>
  )
}

SpotIcon.propTypes = {
  spotKind: PropTypes.string,
}

const NextSpotInfo = compose(
  withNamespaces('poi-plugin-prophet'),
  connect((state, props) => {
    const sortie = state.sortie || {}
    const { sortieMapId, currentNode, item } = sortie
    const spot = `${sortieMapId}-${currentNode}`
    const showLastFormation = get(
      state,
      'config.plugin.prophet.showLastFormation',
      true,
    )

    return {
      currentNode: currentNode || -1,
      sortieMapId: parseInt(sortieMapId || 0, 10),
      allMaps: get(state, 'fcd.map', {}),
      eventId: props.eventId,
      lastFormation:
        showLastFormation &&
        get(extensionSelectorFactory(PLUGIN_KEY)(state), [
          'history',
          spot,
          'fFormation',
        ]),
      item,
    }
  }),
)(
  ({
    currentNode,
    sortieMapId,
    allMaps,
    eventId,
    eventKind,
    lastFormation,
    item,
    t,
  }) => {
    const mapspots = get(
      allMaps,
      `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.spots`,
      {},
    )
    const maproutes = get(
      allMaps,
      `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}.route`,
      {},
    )
    const compassAngle = getCompassAngle(mapspots, maproutes, currentNode)
    const nextSpot = get(maproutes, `${currentNode}.1`, '?')
    // svg arrow's default angle is 135 deg

    const resources = []
    if (item && Object.keys(item).length > 0) {
      Object.keys(item).forEach((itemKey) => {
        resources.push(
          <span key={`${itemKey}-icon`}>
            <MaterialIcon
              materialId={parseInt(itemKey, 10)}
              className="material-icon svg prophet-icon"
            />
          </span>,
        )
        resources.push(
          <span key={`${itemKey}-text`}>
            {item[itemKey] >= 0 ? `+${item[itemKey]}` : item[itemKey]}
          </span>,
        )
      })
    }

    const spotKind = spotInfo[getSpotKind(eventId, eventKind)] || ''

    const spotMessage = getSpotMessage(eventId, eventKind)

    return (
      <div className="next-spot-info">
        <div className="current-info">
          <div>
            <span>{`${t('Compass Point')}: `}</span>
            {Number.isNaN(compassAngle) ? (
              '?'
            ) : (
              <span className="svg" id="prophet-compass">
                <img
                  src={resolve(
                    __dirname,
                    `../assets/icons/compass-arrow-${
                      window.isDarkTheme ? 'dark' : 'light'
                    }.svg`,
                  )}
                  style={{ transform: `rotate(${compassAngle - 135}deg)` }}
                  className="svg prophet-icon compass-icon"
                  alt="compass"
                />
              </span>
            )}
          </div>
          <div>
            <span>
              {nextSpot} ({currentNode})
            </span>
            <SpotIcon spotKind={spotKind} />
            <span>{t(spotKind)}</span>
            {resources}
          </div>
        </div>
        {spotMessage && <div className="spot-message">{t(spotMessage)}</div>}
        <div>{lastFormation && `${t('last_chosen')} ${_t(lastFormation)}`}</div>
      </div>
    )
  },
)

export default NextSpotInfo
