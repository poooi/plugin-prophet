import React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import size from 'lodash/size'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { MaterialIcon } from '../../host/poi-ui'
import { resolvePluginPath } from '../../host/poi-assets'
import { extensionSelectorFactory } from 'views/utils/selectors'
import { getSpotKind, spotInfo, spotIcon, getSpotMessage } from '../../utils/spot'
import type { PoiRootState } from '../../host/poi-types'

const PLUGIN_KEY = 'poi-plugin-prophet'

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

interface NextSpotInfoOwnProps {
  eventId: number
  eventKind: number
  isHeavyBomberDefense: boolean
}

interface NextSpotInfoStateProps {
  currentNode: number
  sortieMapId: number
  allMaps: Record<string, unknown>
  lastFormation: string | false
  lastSmoke: number | false
  item: Record<string, number>
}

function getCompassAngle(
  mapspots: Record<string, [number, number]>,
  maproutes: Record<string, [string, string]>,
  currentNode: number,
): number {
  if (currentNode === -1) return NaN
  if (!mapspots || !Object.keys(mapspots).length) return NaN
  if (!maproutes || !Object.keys(maproutes).length) return NaN

  const route = maproutes[currentNode]
  if (!route) return NaN

  const last = mapspots[route[0]]
  const next = mapspots[route[1]]
  if (!last || !next) return NaN

  return (Math.atan2(next[1] - last[1], next[0] - last[0]) / Math.PI) * 180 + 90
}

const NextSpotInfoInner: React.FC<NextSpotInfoOwnProps & NextSpotInfoStateProps> = ({
  currentNode,
  sortieMapId,
  isHeavyBomberDefense,
  allMaps,
  eventId,
  eventKind,
  lastFormation,
  lastSmoke,
  item,
}) => {
  const { t } = useTranslation('poi-plugin-prophet')

  const mapKey = `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}`
  const mapspots = get(allMaps, `${mapKey}.spots`, {}) as Record<string, [number, number]>
  const maproutes = get(allMaps, `${mapKey}.route`, {}) as Record<string, [string, string]>
  const compassAngle = getCompassAngle(mapspots, maproutes, currentNode)
  const nextSpot = get(maproutes, `${currentNode}.1`, '?') as string

  const resources: React.ReactNode[] = []
  if (size(item) > 0) {
    Object.keys(item).forEach((itemKey) => {
      resources.push(
        <span key={`${itemKey}-icon`}>
          <MaterialIcon materialId={parseInt(itemKey, 10)} className="material-icon svg" />
        </span>,
      )
      resources.push(
        <span key={`${itemKey}-text`}>
          {item[itemKey] >= 0 ? `+${item[itemKey]}` : item[itemKey]}
        </span>,
      )
    })
  }

  const spotKind = spotInfo[getSpotKind(eventId, eventKind)] ?? ''
  const spotMessage = getSpotMessage(eventId, eventKind)
  const spotIconVal = spotIcon[spotKind]
  const isDark = window.isDarkTheme

  const formationHint =
    lastFormation ? `${t('last_chosen')} ${lastFormation}${lastSmoke ? ` (${t('smoke')})` : ''}` : null

  return (
    <Container>
      <CurrentInfo>
        <div>
          {Number.isFinite(compassAngle) && (
            <CompassIcon
              src={resolvePluginPath(`./assets/icons/compass-arrow-${isDark ? 'dark' : 'light'}.svg`)}
              style={{ transform: `rotate(${compassAngle - 135}deg)` }}
              alt="compass"
            />
          )}
          {nextSpot} ({currentNode})
        </div>
        <div>
          {typeof spotIconVal !== 'undefined' && (
            <SpotImage
              src={resolvePluginPath(`./assets/icons/spot/${spotIconVal}.svg`)}
              alt="spot"
            />
          )}
          <span>{t(spotKind)}</span>
          {resources}
        </div>
      </CurrentInfo>
      {spotMessage && <SpotMessage>{t(spotMessage)}</SpotMessage>}
      {isHeavyBomberDefense && <SpotMessage>{t('Heavy Bomber Defense')}</SpotMessage>}
      {formationHint && <div>{formationHint}</div>}
    </Container>
  )
}

export const NextSpotInfo = connect(
  (state: PoiRootState, _props: NextSpotInfoOwnProps): NextSpotInfoStateProps => {
    const sortie = state.sortie ?? { sortieMapId: '0', currentNode: 0 }
    const { sortieMapId, currentNode } = sortie
    const spot = `${sortieMapId}-${currentNode}`
    const showLastFormation = get(state, 'config.plugin.prophet.showLastFormation', true) as boolean
    const ext = extensionSelectorFactory(PLUGIN_KEY)(state as never) as Record<string, unknown> | undefined

    return {
      currentNode: currentNode ?? -1,
      sortieMapId: parseInt(String(sortieMapId ?? 0), 10),
      allMaps: get(state, 'fcd.map', {}) as Record<string, unknown>,
      lastFormation:
        showLastFormation ? (get(ext, ['history', spot, 'fFormation']) as string | false) ?? false : false,
      lastSmoke:
        showLastFormation ? (get(ext, ['history', spot, 'smokeType']) as number | false) ?? false : false,
      item: get(sortie, 'item', {}) as Record<string, number>,
    }
  },
)(NextSpotInfoInner)
