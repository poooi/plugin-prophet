import FontAwesome from 'react-fontawesome'
import React from 'react'
import { createSelector } from 'reselect'
import _ from 'lodash'
import { connect } from 'react-redux'
import { Tooltip } from 'views/components/etc/overlay'
import { withNamespaces } from 'react-i18next'
import { compose } from 'redux'
import styled from 'styled-components'

import { extensionSelectorFactory } from 'views/utils/selectors'

import ShipView from './ship-view'
import FleetView from './fleet-view'
import SquadView from './squad-view'
import BattleInfo from './battle-info'
import DropInfo from './drop-info'
import NextSpotInfo from './next-spot-info'
import {
  PLUGIN_KEY,
  combinedFleetType,
  getTPDazzyDing,
  SortieState,
} from '../utils'

const FleetsContainer = styled.div`
  display: flex;
  flex-direction: ${({ horizontalLayout }) =>
    horizontalLayout ? 'row' : 'column'};
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

const FleetTitle = styled.div`
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

const CombatVS = styled.div`
  flex: 0;
  margin-left: 0.5em;
  margin-right: 0.5em;
  cursor: default;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
`

const inEventSelector = createSelector(
  [(state) => state.const.$maps],
  (maps = {}) => Object.keys(maps).some((mapId) => +mapId > 100),
)

const escapedShipIdSelector = createSelector(
  [
    (state) => _.get(state, 'sortie.escapedPos', []),
    (state) => _.get(state, 'sortie.combinedFlag', 0),
    (state) => state,
  ],
  (escapedPos, combinedFlag, state) => {
    if (combinedFlag > 0) {
      const shipIds = _.flatMap([0, 1], (fleetId) =>
        _.get(state, `info.fleets.${fleetId}.api_ship`),
      ) // -1 for no ship, considered safe
      return escapedPos.map((pos) => shipIds[pos])
    }
    return [] // because you could only escape in combined fleet
  },
)

const BattleViewArea = compose(
  withNamespaces('poi-plugin-prophet'),
  connect((state, props) => {
    const sortie = state.sortie || {}
    const { sortieMapId, currentNode, combinedFlag } = sortie
    const showEnemyTitle = _.get(
      state,
      'config.plugin.prophet.showEnemyTitle',
      true,
    )
    const spot =
      props.sortieState === SortieState.Practice
        ? 'practice'
        : `${sortieMapId}-${currentNode}`
    let enemyTitle =
      props.sortieState === SortieState.Practice ? 'PvP' : 'Enemy Vessel'
    enemyTitle = showEnemyTitle
      ? _.get(
          extensionSelectorFactory(PLUGIN_KEY)(state),
          ['history', spot, 'title'],
          enemyTitle,
        )
      : enemyTitle

    const escapedShipIds = escapedShipIdSelector(state)
    const inEvent = inEventSelector(state)
    const TP = inEvent
      ? getTPDazzyDing([
          ...(props.mainFleet || []),
          ...(props.escortFleet || []),
          escapedShipIds,
        ])
      : { total: 0, actual: 0 }

    let friendTitle = 'Sortie Fleet'
    if (showEnemyTitle) {
      if (combinedFlag > 0) {
        friendTitle = combinedFleetType[combinedFlag] || 'Combined Fleet'
      } else {
        friendTitle = _.get(
          state,
          `info.fleets.${props.fleetIds[0]}.api_name`,
          'Sortie Fleet',
        )
      }
    }
    friendTitle = props.isBaseDefense ? 'Land Base' : friendTitle

    return {
      ecGameOrder: _.get(state, 'config.plugin.prophet.ecGameOrder', true),
      mainFleet: props.mainFleet,
      escortFleet: props.escortFleet,
      enemyFleet: props.enemyFleet,
      enemyEscort: props.enemyEscort,
      landBase: props.landBase,
      airForce: props.airForce,
      airControl: props.airControl,
      isBaseDefense: props.isBaseDefense,
      sortieState: props.sortieState,
      eventId: props.eventId,
      eventKind: props.eventKind,
      result: props.result,
      battleForm: props.battleForm,
      eFormation: props.eFormation,
      enemyTitle,
      friendTitle,
      TP,
    }
  }),
)(
  ({
    ecGameOrder,
    mainFleet = [],
    escortFleet = [],
    enemyFleet = [],
    enemyEscort = [],
    landBase = [],
    airForce = [], // [count, lostCount, enemyCount, enemyLostCount]
    airControl = 0,
    isBaseDefense,
    sortieState = SortieState.InPort,
    eventId = 0,
    eventKind = 0,
    result = {},
    battleForm = '',
    eFormation = '',
    enemyTitle,
    friendTitle,
    TP,
    t,
    horizontalLayout,
    root,
  }) => {
    const View = isBaseDefense ? SquadView : ShipView
    const times = !horizontalLayout ? 1 : 2
    // adapt the view according to layout by setting FleetView's div xs = 12/count
    // this can support 12v6, 6v12 and 12v12
    const fleetCount =
      1 && _.sumBy([mainFleet, escortFleet], (fleet) => fleet != null)
    const enemyCount =
      1 && _.sumBy([enemyFleet, enemyEscort], (fleet) => fleet != null)
    const fleetWidth = escortFleet && !isBaseDefense ? 2 : 1
    const enemyWidth = enemyEscort && !isBaseDefense ? 2 : 1
    const { getShip, getItem } = _.pick(result, ['getShip', 'getItem'])
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
                      <span>
                        {`${t('A_rank')}${Math.floor(TP.actual * 0.7)}`}
                      </span>
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
          <CombatVS
            visible={sortieState > SortieState.Navigation || isBaseDefense}
          >
            vs
          </CombatVS>
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
        result={result && result.rank}
        eFormation={eFormation}
        battleForm={battleForm}
        airControl={airControl}
      />
    )
    const mapInfo = (
      <ProphetInfo className="alert prophet-info">
        {
          /* eslint-disable no-nested-ternary */
          sortieState === SortieState.Navigation && !isBaseDefense ? (
            <NextSpotInfo eventId={eventId} eventKind={eventKind} />
          ) : isBaseDefense ? (
            [
              battleInfo,
              <NextSpotInfo eventId={eventId} eventKind={eventKind} />,
            ]
          ) : getShip || getItem ? (
            <DropInfo getShip={getShip} getItem={getItem} />
          ) : sortieState > SortieState.Navigation || isBaseDefense ? (
            battleInfo
          ) : (
            <noscript />
          )
          /* eslint-enable no-nested-ternary */
        }
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
                horizontalLayout && (enemyEscort || []).length
                  ? 'column-reverse'
                  : 'column',
            }}
          >
            {enemyForce}
            {!horizontalLayout ? mapInfo : null}
          </FleetContainer>
        </FleetsContainer>
        {horizontalLayout ? mapInfo : null}
      </div>
    )
  },
)

export default BattleViewArea
