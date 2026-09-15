import FontAwesome from 'react-fontawesome'
import React from 'react'
import { createSelector } from 'reselect'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Tooltip } from 'views/components/etc/overlay'

import { SortieState, type SortieStateValue } from '../utils/constants'
import { tankTransportMapsSelector } from '../redux'
import { selectFleetsEquips } from '../selectors'
import { calculateTransport, type TransportMode } from '../utils/transport'

const StatGroup = styled.span`
  margin-left: 1ex;
  margin-right: 1ex;

  /* the friend FleetTitle resets the trailing margin on its own last stat */
  &:last-child {
    margin-right: 0;
  }

  .svg-inline--fa {
    margin-right: 1ex;
  }
`

const modeDisplay: Record<TransportMode, { icon: string; label: string }> = {
  normal: { icon: 'database', label: 'Transport Point' },
  tank: { icon: 'truck', label: 'Tank Transport Point' },
}

// The api hands the map id over as a string on some responses.
const isTankTransportMap = (
  sortieMapId: number | undefined,
  tankTransportMaps: readonly number[],
): boolean => Number.isFinite(sortieMapId) && tankTransportMaps.includes(sortieMapId as number)

const inEventSelector = createSelector(
  [(state: PoiRootState) => state.const?.$maps],
  (maps = {}) => Object.keys(maps).some((mapId) => +mapId > 100),
)

const escapedShipIdSelector = createSelector(
  [
    (state: PoiRootState) => state.sortie.escapedPos ?? [],
    (state: PoiRootState) => state.sortie.combinedFlag ?? 0,
    (state: PoiRootState) => state,
  ],
  (escapedPos: number[], combinedFlag: number, state: PoiRootState) => {
    if (combinedFlag > 0) {
      const shipIds = _.flatMap([0, 1], (fleetId) =>
        state.info?.fleets?.[fleetId]?.api_ship ?? [],
      )
      return escapedPos.map((pos) => shipIds[pos])
    }
    return []
  },
)

interface TransportPointsProps {
  sortieState: SortieStateValue
}

const TransportPoints: React.FC<TransportPointsProps> = ({ sortieState }) => {
  const { t } = useTranslation('poi-plugin-prophet')
  const sortieMapId = useSelector((state: PoiRootState) => state.sortie.sortieMapId)
  const escapedShipIds = useSelector(escapedShipIdSelector)
  const inEvent = useSelector(inEventSelector)
  const tankTransportMaps = useSelector(tankTransportMapsSelector)
  // TP comes from the Poi fleet/equipment pairs, not the lib-battle view models.
  // selectFleetsEquips rebuilds its nested arrays, so compare them deeply to
  // keep the selector reference stable between identical states.
  const { fleets, equips } = useSelector(selectFleetsEquips, _.isEqual)

  if (!inEvent) return null

  // in port the map is not decided yet, so both tables are shown side by side;
  // once sortied only the one the map actually uses is relevant
  const shownModes: TransportMode[] =
    sortieState === SortieState.InPort
      ? ['normal', 'tank']
      : isTankTransportMap(Number(sortieMapId), tankTransportMaps)
        ? ['tank']
        : ['normal']

  return (
    <>
      {shownModes.map((mode) => {
        const { icon, label } = modeDisplay[mode]
        const { planned, deliverable, hasTransportCargo } =
          calculateTransport(fleets, equips, { escapedShipIds, mode })
        return (
          hasTransportCargo && planned > 0 && (
            <StatGroup key={label}>
              <Tooltip
                position="bottom"
                content={
                  <div id="tp-indicator">
                    <div>{t(label)}</div>
                    <span>{`${t('A_rank')}${Math.floor(deliverable * 0.7)}`}</span>
                  </div>
                }
              >
                <span>
                  <FontAwesome name={icon} />[
                  {planned !== deliverable && <span>{`${deliverable} / `}</span>}
                  <span>{planned}</span>]
                </span>
              </Tooltip>
            </StatGroup>
          )
        )
      })}
    </>
  )
}

export default TransportPoints
