import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { size } from 'lodash'
import { useTranslation } from 'react-i18next'
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
import type { ProphetExtState } from '../types'
import { isPoiDarkTheme } from '../host/poi-assets'

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

const getCompassAngle = (
  mapspots: Record<string, number[]> | undefined,
  maproutes: Record<string, number[]> | undefined,
  currentNode: number,
): number => {
  if (currentNode === -1) return NaN
  if (!mapspots || !Object.keys(mapspots).length) return NaN
  if (!maproutes || !Object.keys(maproutes).length) return NaN

  const route = maproutes[String(currentNode)] ?? []
  const last = route[0] != null ? (mapspots[String(route[0])] ?? []) : []
  const next = route[1] != null ? (mapspots[String(route[1])] ?? []) : []
  if (!last.length || !next.length) return NaN

  return (Math.atan2(next[1] - last[1], next[0] - last[0]) / Math.PI) * 180 + 90
}

interface SpotIconProps {
  spotKind: string
}

const SpotIcon: FC<SpotIconProps> = ({ spotKind }) => {
  if (typeof spotIcon[spotKind] === 'undefined') return null
  const iconPath = resolvePluginPath(`./assets/icons/spot/${spotIcon[spotKind]}.svg`)
  return <SpotImage src={iconPath} alt="spot" />
}

interface NextSpotInfoProps {
  eventId: number
  eventKind: number
  isHeavyBomberDefense?: boolean
}

const NextSpotInfo: FC<NextSpotInfoProps> = ({ eventId, eventKind, isHeavyBomberDefense }) => {
  const { t } = useTranslation('poi-plugin-prophet')

  const currentNode = useSelector((state: PoiRootState) => {
    const node = state.sortie.currentNode
    return typeof node === 'number' ? node : -1
  })
  const sortieMapId = useSelector((state: PoiRootState) => state.sortie.sortieMapId ?? 0)
  const allMaps = useSelector((state: PoiRootState) => state.fcd?.map ?? {})
  const item = useSelector((state: PoiRootState) => state.sortie.item)
  const showLastFormation = useSelector(
    (state: PoiRootState) => state.config?.plugin?.prophet?.showLastFormation ?? true,
  )
  const spot = `${sortieMapId}-${currentNode}`
  const lastFormation = useSelector((state: PoiRootState) => {
    if (!showLastFormation) return undefined
    const ext = extensionSelectorFactory(PLUGIN_KEY)(state) as ProphetExtState
    return ext.history?.[spot]?.fFormation
  })
  const lastSmoke = useSelector((state: PoiRootState) => {
    if (!showLastFormation) return undefined
    const ext = extensionSelectorFactory(PLUGIN_KEY)(state) as ProphetExtState
    return ext.history?.[spot]?.smokeType
  })

  const mapKey = `${Math.floor(sortieMapId / 10)}-${sortieMapId % 10}`
  const mapData = allMaps[mapKey]
  const mapspots = mapData?.spots
  const maproutes = mapData?.route
  const compassAngle = getCompassAngle(mapspots, maproutes, currentNode)
  const nextSpot = maproutes?.[String(currentNode)]?.[1] ?? '?'

  const resources: React.ReactNode[] = []
  if (item && size(item) > 0) {
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
                `./assets/icons/compass-arrow-${isPoiDarkTheme() ? 'dark' : 'light'}.svg`,
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
      {isHeavyBomberDefense && <SpotMessage>{t('Heavy Bomber Defense')}</SpotMessage>}
      <div>
        {lastFormation &&
          `${t('last_chosen')} ${_t(lastFormation)}${lastSmoke ? ` (${t('smoke')})` : ''}`}
      </div>
    </Container>
  )
}

export default NextSpotInfo
