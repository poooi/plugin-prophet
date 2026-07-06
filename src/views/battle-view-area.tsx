import FontAwesome from 'react-fontawesome'
import React, { FC } from 'react'
import { createSelector } from 'reselect'
import _ from 'lodash'
import { useSelector } from 'react-redux'
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
import type { ProphetBattleResult } from '../types'
import {
  battleSpotKey,
  enemyTitle as buildEnemyTitle,
  friendTitle as buildFriendTitle,
  transportPoints,
} from './battle-view-model'

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
  sortieState?: number
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
        ) as string
      : undefined,
  )
  const enemyTitle = buildEnemyTitle({ sortieState, showEnemyTitle, storedEnemyTitle: historyTitle })

  const escapedShipIds = useSelector(escapedShipIdSelector)
  const inEvent = useSelector(inEventSelector)
  const TP = transportPoints({ inEvent, mainFleet, escortFleet, escapedShipIds })

  const fleetName = useSelector((state: PoiRootState) =>
    state.info?.fleets?.[fleetIds[0]]?.api_name ?? 'Sortie Fleet',
  )
  const friendTitle = buildFriendTitle({
    showEnemyTitle,
    combinedFlag,
    fleetName,
    isBaseDefense,
  })

  const View = isBaseDefense ? SquadView : ShipView
  const times = !horizontalLayout ? 1 : 2
  const fleetCount = _.sumBy([mainFleet, escortFleet], (fleet) => fleet != null ? 1 : 0)
  const enemyCount = _.sumBy([enemyFleet, enemyEscort], (fleet) => fleet != null ? 1 : 0)
  const fleetWidth = escortFleet && !isBaseDefense ? 2 : 1
  const enemyWidth = enemyEscort && !isBaseDefense ? 2 : 1
  const { getShip, getItem } = _.pick(result, ['getShip', 'getItem']) as { getShip?: number; getItem?: number }

  const alliedForce = (
    <Fleets>
      <FleetView
        fleet={isBaseDefense ? landBase : mainFleet}
        title={t('Main Fleet')}
        count={times * fleetCount}
        View={View}
        root={root}
      />
      <FleetView
        fleet={isBaseDefense ? undefined : escortFleet}
        title={t('Escort Fleet')}
        count={times * fleetCount}
        View={View}
        root={root}
      />
    </Fleets>
  )

  const enemyForce =
    sortieState > SortieState.Navigation || isBaseDefense ? (
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
          {TP.total > 0 && !isBaseDefense && (
            <StatGroup>
              <Tooltip
                position="bottom"
                content={
                  <div id="tp-indicator">
                    <span>{`${t('A_rank')}${Math.floor(TP.actual * 0.7)}`}</span>
                  </div>
                }
              >
                <span>
                  <FontAwesome name="database" />[
                  {TP.total !== TP.actual && <span>{`${TP.actual} / `}</span>}
                  <span>{TP.total}</span>]
                </span>
              </Tooltip>
            </StatGroup>
          )}
          {airForce[0] > 0 && (
            <StatGroup>
              <FontAwesome name="plane" />
              {`[${airForce[0] - airForce[1]} / ${airForce[0]}]`}
            </StatGroup>
          )}
        </FleetTitle>
        <CombatVS visible={sortieState > SortieState.Navigation || isBaseDefense}>vs</CombatVS>
        {sortieState > SortieState.Navigation || isBaseDefense ? (
          <FleetTitle title={t(enemyTitle)}>
            {airForce[2] > 0 && (
              <StatGroup>
                <FontAwesome name="plane" />
                {` [${airForce[2] - airForce[3]} / ${airForce[2]}]`}
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
      {sortieState === SortieState.Navigation && !isBaseDefense ? (
        <NextSpotInfo
          eventId={eventId}
          eventKind={eventKind}
          isHeavyBomberDefense={isHeavyBomberDefense}
        />
      ) : isBaseDefense ? (
        [
          battleInfo,
          <NextSpotInfo
            key="next-spot"
            eventId={eventId}
            eventKind={eventKind}
            isHeavyBomberDefense={isHeavyBomberDefense}
          />,
        ]
      ) : getShip || getItem ? (
        <DropInfo getShip={getShip} getItem={getItem} />
      ) : sortieState > SortieState.Navigation || isBaseDefense ? (
        battleInfo
      ) : (
        <noscript />
      )}
      {/* eslint-enable no-nested-ternary */}
    </ProphetInfo>
  )

  return (
    <div id="overview-area">
      {horizontalLayout ? combatInfo : null}
      <FleetsContainer horizontalLayout={horizontalLayout}>
        <FleetContainer
          className="fleet-container"
          style={{
            flex: horizontalLayout ? fleetWidth : 1,
            flexDirection:
              horizontalLayout && (escortFleet || []).length && !isBaseDefense
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
    </div>
  )
}

export default BattleViewArea
