import React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { HPBar } from './hp-bar'
import { resolvePluginPath } from '../../host/poi-assets'
import type { PoiRootState } from '../../host/poi-types'

const SquadContainer = styled.div`
  width: 50%;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
`

const SquadTitle = styled.span`
  margin-right: 6px;
  font-size: 1.1em;
  min-width: 2.5em;
`

const PlaneInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  font-size: 0.9em;
`

const PlaneRow = styled.div`
  display: flex;
  align-items: center;
`

const PlaneIcon = styled.img`
  width: 16px;
  height: 16px;
  margin-right: 4px;
  object-fit: contain;
`

const PlaneSlotItem = styled.span`
  opacity: 0.7;
  margin-right: 2px;
`

interface Plane {
  count: number
  name: string
  iconId: number
  max: number
  now: number
}

interface LandBaseSquadOwnProps {
  squadId: number
  planes: Plane[]
}

interface LandBaseSquadStateProps {
  squadLabel: string
  enableAvatar: boolean
}

const LandBaseSquadInner: React.FC<LandBaseSquadOwnProps & LandBaseSquadStateProps> = ({
  squadId,
  planes,
  squadLabel,
}) => {
  const { t } = useTranslation('poi-plugin-prophet')

  if (!planes || planes.length === 0) return null

  return (
    <SquadContainer>
      <SquadTitle>{squadLabel || `LB${squadId}`}</SquadTitle>
      <PlaneInfo>
        {planes.map((plane, idx) => (
          <PlaneRow key={idx}>
            <PlaneIcon
              src={resolvePluginPath(
                `./assets/icons/plane/${plane.iconId ?? 0}.svg`,
              )}
              alt={t(plane.name)}
            />
            <PlaneSlotItem>
              {plane.count}/{plane.max}
            </PlaneSlotItem>
            <HPBar
              max={plane.max}
              from={plane.max}
              to={plane.now}
              damage={plane.max - plane.now}
              stage={0}
              item={0}
              cond={0}
            />
          </PlaneRow>
        ))}
      </PlaneInfo>
    </SquadContainer>
  )
}

export const LandBaseSquad = connect(
  (state: PoiRootState, props: LandBaseSquadOwnProps): LandBaseSquadStateProps => {
    const squadLabel = get(state, `info.airbase.${props.squadId - 1}.api_name`, '') as string
    return {
      squadLabel,
      enableAvatar: get(state, 'config.plugin.prophet.showAvatar', false) as boolean,
    }
  },
)(LandBaseSquadInner)
