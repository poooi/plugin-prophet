import FontAwesome from 'react-fontawesome'
import React, { FC, useEffect, useState } from 'react'
import { createSelector } from 'reselect'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { Collapse } from '@blueprintjs/core'
import { Tooltip } from 'views/components/etc/overlay'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import type { Ship } from 'poi-lib-battle'

import { extensionSelectorFactory } from 'views/utils/selectors'

import ShipView from './ship-view'
import FleetView from './fleet-view'
import SquadView from './squad-view'
import BattleInfo from './battle-info'
import DropInfo from './drop-info'
import NextSpotInfo from './next-spot-info'
import { PLUGIN_KEY, SortieState } from '../utils'
import { tankTransportMapsSelector } from '../redux'
import type { ProphetBattleResult } from '../types'
import type { SortieStateValue } from '../utils/constants'
import {
  battleSpotKey,
  enemyTitle as buildEnemyTitle,
  friendTitle as buildFriendTitle,
  isTankTransportMap,
  transportPoints,
} from './battle-view-model'
import type { TPResult } from '../utils/transport'

const FleetsContainer = styled.div<{ horizontalLayout?: boolean }>`
  display: flex;
  flex-direction: ${({ horizontalLayout }) => (horizontalLayout ? 'row' : 'column')};
`

const FleetContainer = styled.div`
  display: flex;
  overflow: hidden;
`

const ProphetInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 4px;
  flex-direction: column;
`

const Fleets = styled.div`
  display: flex;
`

const CombatTitle = styled.div`
  display: flex;
  line-height: 32px;
  width: 100%;
`

const StatGroup = styled.span`
  margin-left: 1ex;
  margin-right: 1ex;

  .svg-inline--fa {
    margin-right: 1ex;
  }
`

const FleetTitle = styled.div<{ isFriend?: boolean }>`
  flex: 1;
  margin-left: 0.5em;
  margin-right: 0.5em;
  white-space: nowrap;
  cursor: default;
  display: flex;
  overflow: hidden;
  justify-content: ${({ isFriend }) => isFriend && 'flex-end'};

  ${StatGroup}:last-child {
    margin-right: ${({ isFriend }) => isFriend && 0};
  }

  ${StatGroup}:first-child {
    margin-left: ${({ isFriend }) => !isFriend && 0};
  }
`

const FleetName = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
`

const CombatVS = styled.div<{ visible?: boolean }>`
  flex: 0;
  margin-left: 0.5em;
  margin-right: 0.5em;
  cursor: default;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
`

const AirRaidPanel = styled.div`
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.4);
`

const AirRaidBody = styled.div`
  padding-top: 8px;
  padding-bottom: 8px;
`

const AirRaidHeader = styled.div<{ isOpen?: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  line-height: 24px;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }

  /* one icon rotated, so the label does not shift when toggling */
  .svg-inline--fa {
    margin-right: 1ex;
    width: 1ex;
    transform: rotate(${({ isOpen }) => (isOpen ? 90 : 0)}deg);
  }
`

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

interface BattleViewAreaProps {
  mainFleet?: (Ship | null)[]
  escortFleet?: (Ship | null)[]
  enemyFleet?: (Ship | null)[]
  enemyEscort?: (Ship | null)[]
  landBase?: (Ship | null)[]
  airForce?: number[]
  airControl?: string
  isBaseDefense?: boolean
  isHeavyBomberDefense?: boolean
  sortieState?: SortieStateValue
  eventId?: number
  eventKind?: number
  result?: ProphetBattleResult
  battleForm?: string
  eFormation?: string
  fleetIds?: number[]
  horizontalLayout?: boolean
  root?: Element | null
  smokeType?: number
}

const BattleViewArea: FC<BattleViewAreaProps> = ({
  mainFleet = [],
  escortFleet = [],
  enemyFleet = [],
  enemyEscort = [],
  landBase = [],
  airForce = [],
  airControl = '',
  isBaseDefense,
  isHeavyBomberDefense,
  sortieState = SortieState.InPort,
  eventId = 0,
  eventKind = 0,
  result = {},
  battleForm = '',
  eFormation = '',
  fleetIds = [],
  horizontalLayout,
  root,
  smokeType,
}) => {
  const { t } = useTranslation('poi-plugin-prophet')

  const sortie = useSelector((state: PoiRootState) => state.sortie)
  const { sortieMapId, currentNode, combinedFlag } = sortie
  const showEnemyTitle = useSelector((state: PoiRootState) =>
    state.config?.plugin?.prophet?.showEnemyTitle ?? true,
  )
  const ecGameOrder = useSelector((state: PoiRootState) =>
    state.config?.plugin?.prophet?.ecGameOrder ?? true,
  )
  const spot = battleSpotKey(sortieState, sortieMapId, currentNode)
  const historyTitle = useSelector((state: PoiRootState) =>
    showEnemyTitle
      ? _.get(
          extensionSelectorFactory(PLUGIN_KEY)(state),
          ['history', spot, 'title'],
          undefined,
        ) as string | undefined
      : undefined,
  )
  const enemyTitle = buildEnemyTitle({ sortieState, showEnemyTitle, storedEnemyTitle: historyTitle })

  const escapedShipIds = useSelector(escapedShipIdSelector)
  const inEvent = useSelector(inEventSelector)
  const tankTransportMaps = useSelector(tankTransportMapsSelector)
  const TP = transportPoints({ inEvent, mainFleet, escortFleet, escapedShipIds })
  // in port the map is not decided yet, so both tables are shown side by side;
  // once sortied only the one the map actually uses is relevant
  const shownTP: { tp: TPResult; icon: string; label: string }[] =
    sortieState === SortieState.InPort
      ? [
          { tp: TP.normal, icon: 'database', label: 'Transport Point' },
          { tp: TP.tank, icon: 'truck', label: 'Tank Transport Point' },
        ]
      : // the api hands the map id over as a string on some responses
        isTankTransportMap(Number(sortieMapId), tankTransportMaps)
        ? [{ tp: TP.tank, icon: 'truck', label: 'Tank Transport Point' }]
        : [{ tp: TP.normal, icon: 'database', label: 'Transport Point' }]

  const fleetName = useSelector((state: PoiRootState) =>
    state.info?.fleets?.[fleetIds[0]]?.api_name ?? 'Sortie Fleet',
  )
  const [airRaidOpen, setAirRaidOpen] = useState(true)
  const toggleAirRaid = () => setAirRaidOpen((open) => !open)

  // every raid starts expanded, even if the previous one was collapsed by hand
  useEffect(() => {
    if (isBaseDefense) setAirRaidOpen(true)
  }, [isBaseDefense, sortieMapId, currentNode])

  const times = !horizontalLayout ? 1 : 2
  const fleetCount = _.sumBy([mainFleet, escortFleet], (fleet) => fleet != null ? 1 : 0)
  const enemyCount = _.sumBy([enemyFleet, enemyEscort], (fleet) => fleet != null ? 1 : 0)
  const { getShip, getItem } = _.pick(result, ['getShip', 'getItem']) as { getShip?: number; getItem?: number }

  // `baseDefense` selects which battle is being drawn: the land base air defense
  // (shown in the collapsible panel) or the sortie fleet (shown as usual below it).
  // The air raid's own stats (air force, rank, formations) belong to the panel only;
  // the sortie area relies on an air raid always leaving `sortieState` at Navigation,
  // which keeps it on `NextSpotInfo` instead of the raid's `BattleInfo`.
  const renderArea = (baseDefense: boolean): React.ReactElement => {
    const friendTitle = buildFriendTitle({
      showEnemyTitle,
      combinedFlag,
      fleetName,
      isBaseDefense: baseDefense,
    })
    const View = baseDefense ? SquadView : ShipView
    // air force / battle result belong to the air raid whenever there is one
    const shownAirForce = baseDefense === Boolean(isBaseDefense) ? airForce : []
    const showEnemy = sortieState > SortieState.Navigation || baseDefense
    const fleetWidth = escortFleet && !baseDefense ? 2 : 1
    const enemyWidth = enemyEscort && !baseDefense ? 2 : 1

    const alliedForce = (
      <Fleets>
        <FleetView
          fleet={baseDefense ? landBase : mainFleet}
          title={t('Main Fleet')}
          count={times * fleetCount}
          View={View}
          root={root}
        />
        <FleetView
          fleet={baseDefense ? undefined : escortFleet}
          title={t('Escort Fleet')}
          count={times * fleetCount}
          View={View}
          root={root}
        />
      </Fleets>
    )

    const enemyForce = showEnemy ? (
      <Fleets style={{ flexDirection: ecGameOrder ? 'row-reverse' : 'row' }}>
        <FleetView
          fleet={enemyFleet}
          title={t('Enemy Fleet')}
          count={times * enemyCount}
          root={root}
        />
        <FleetView
          fleet={enemyEscort}
          title={t('Enemy Escort Fleet')}
          count={times * enemyCount}
          root={root}
        />
      </Fleets>
    ) : (
      <noscript />
    )

    const combatInfo = (
      <ProphetInfo>
        <CombatTitle>
          <FleetTitle isFriend title={t(friendTitle)}>
            <FleetName>{`${t(friendTitle)}`}</FleetName>
            {!baseDefense &&
              shownTP.map(
                ({ tp, icon, label }) =>
                  tp.total > 0 && (
                    <StatGroup key={label}>
                      <Tooltip
                        position="bottom"
                        content={
                          <div id="tp-indicator">
                            <div>{t(label)}</div>
                            <span>{`${t('A_rank')}${Math.floor(tp.actual * 0.7)}`}</span>
                          </div>
                        }
                      >
                        <span>
                          <FontAwesome name={icon} />[
                          {tp.total !== tp.actual && <span>{`${tp.actual} / `}</span>}
                          <span>{tp.total}</span>]
                        </span>
                      </Tooltip>
                    </StatGroup>
                  ),
              )}
            {shownAirForce[0] > 0 && (
              <StatGroup>
                <FontAwesome name="plane" />
                {`[${shownAirForce[0] - shownAirForce[1]} / ${shownAirForce[0]}]`}
              </StatGroup>
            )}
          </FleetTitle>
          <CombatVS visible={showEnemy}>vs</CombatVS>
          {showEnemy ? (
            <FleetTitle title={t(enemyTitle)}>
              {shownAirForce[2] > 0 && (
                <StatGroup>
                  <FontAwesome name="plane" />
                  {` [${shownAirForce[2] - shownAirForce[3]} / ${shownAirForce[2]}]`}
                </StatGroup>
              )}
              <FleetName>{t(enemyTitle)}</FleetName>
            </FleetTitle>
          ) : (
            <FleetTitle />
          )}
        </CombatTitle>
      </ProphetInfo>
    )

    const battleInfo = (
      <BattleInfo
        result={result?.rank}
        eFormation={eFormation}
        battleForm={battleForm}
        airControl={airControl}
        smokeType={smokeType}
      />
    )

    const mapInfo = (
      <ProphetInfo className="alert prophet-info">
        {/* eslint-disable no-nested-ternary */}
        {baseDefense ? (
          battleInfo
        ) : sortieState === SortieState.Navigation ? (
          <NextSpotInfo
            eventId={eventId}
            eventKind={eventKind}
            isHeavyBomberDefense={isHeavyBomberDefense}
          />
        ) : getShip || getItem ? (
          <DropInfo getShip={getShip} getItem={getItem} />
        ) : sortieState > SortieState.Navigation ? (
          battleInfo
        ) : (
          <noscript />
        )}
        {/* eslint-enable no-nested-ternary */}
      </ProphetInfo>
    )

    return (
      <>
        {horizontalLayout ? combatInfo : null}
        <FleetsContainer horizontalLayout={horizontalLayout}>
          <FleetContainer
            className="fleet-container"
            style={{
              flex: horizontalLayout ? fleetWidth : 1,
              flexDirection:
                horizontalLayout && (escortFleet || []).length && !baseDefense
                  ? 'column-reverse'
                  : 'column',
            }}
          >
            {alliedForce}
            {!horizontalLayout ? combatInfo : null}
          </FleetContainer>
          <FleetContainer
            className="fleet-container"
            style={{
              flex: horizontalLayout ? enemyWidth : 1,
              flexDirection:
                horizontalLayout && (enemyEscort || []).length ? 'column-reverse' : 'column',
            }}
          >
            {enemyForce}
            {!horizontalLayout ? mapInfo : null}
          </FleetContainer>
        </FleetsContainer>
        {horizontalLayout ? mapInfo : null}
      </>
    )
  }

  return (
    <div id="overview-area">
      {isBaseDefense && (
        <AirRaidPanel className="air-raid-panel">
          <AirRaidHeader
            isOpen={airRaidOpen}
            onClick={toggleAirRaid}
            role="button"
            tabIndex={0}
            aria-expanded={airRaidOpen}
            aria-controls="air-raid-body"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleAirRaid()
              }
            }}
          >
            <FontAwesome name="caret-right" />
            <span>{t('Air Defense')}</span>
          </AirRaidHeader>
          <Collapse isOpen={airRaidOpen}>
            <AirRaidBody id="air-raid-body">{renderArea(true)}</AirRaidBody>
          </Collapse>
        </AirRaidPanel>
      )}
      {renderArea(false)}
    </div>
  )
}

export default BattleViewArea
