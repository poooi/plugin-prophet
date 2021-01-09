import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { get, size } from 'lodash'
import { withNamespaces } from 'react-i18next'
import { compose } from 'redux'
import styled from 'styled-components'

import { extensionSelectorFactory } from 'views/utils/selectors'
import { MaterialIcon } from 'views/components/etc/icon'

import {
  PLUGIN_KEY,
  _t,
  spotIcon,
  spotInfo,
  getSpotKind,
  getSpotMessage,
  resolvePluginPath,
} from '../utils'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const CurrentInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  > div {
    display: flex;
    align-items: center;
  }

  div + div {
    margin-left: 2rem;
  }
`

const CompassIcon = styled.img`
  width: 16px;
  height: 16px;
  margin-right: 1ex;
`

const SpotMessage = styled.div`
  white-space: normal;
`

const SpotImage = styled.img`
  width: 16px;
  height: 16px;
  margin-right: 1ex;
`

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
    return null
  }
  const iconPath = resolvePluginPath(
    `./assets/icons/spot/${spotIcon[spotKind]}.svg`,
  )
  return <SpotImage src={iconPath} alt="spot" />
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
    if (size(item) > 0) {
      Object.keys(item).forEach((itemKey) => {
        resources.push(
          <span key={`${itemKey}-icon`}>
            <MaterialIcon
              materialId={parseInt(itemKey, 10)}
              className="material-icon svg"
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
      <Container>
        <CurrentInfo>
          <div>
            {Number.isFinite(compassAngle) && (
              <CompassIcon
                src={resolvePluginPath(
                  `./assets/icons/compass-arrow-${
                    window.isDarkTheme ? 'dark' : 'light'
                  }.svg`,
                )}
                style={{ transform: `rotate(${compassAngle - 135}deg)` }}
                alt="compass"
              />
            )}
            {nextSpot} ({currentNode})
          </div>
          <div>
            <SpotIcon spotKind={spotKind} />
            <span>{t(spotKind)}</span>
            {resources}
          </div>
        </CurrentInfo>
        {spotMessage && <SpotMessage>{t(spotMessage)}</SpotMessage>}
        <div>{lastFormation && `${t('last_chosen')} ${_t(lastFormation)}`}</div>
      </Container>
    )
  },
)

export default NextSpotInfo
