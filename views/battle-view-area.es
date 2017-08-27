import FontAwesome from 'react-fontawesome'
import React from 'react'
import { createSelector } from 'reselect'
import _ from 'lodash'
import { connect } from 'react-redux'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'

import { fleetShipsDataSelectorFactory,
  fleetShipsEquipDataSelectorFactory,
  extensionSelectorFactory } from 'views/utils/selectors'

import ShipView from './ship-view'
import FleetView from './fleet-view'
import SquadView from './squad-view'
import BattleInfo from './battle-info'
import DropInfo from './drop-info'
import NextSpotInfo from './next-spot-info'
import { PLUGIN_KEY, combinedFleetType, getTransportPoint } from '../utils'

const { i18n } = window
const __ = i18n['poi-plugin-prophet'].__.bind(i18n['poi-plugin-prophet'])

const inEventSelector = createSelector(
  [
    state => state.const.$maps,
  ], (maps = {}) => Object.keys(maps).some(mapId => (+mapId) > 100)
)

const normalizedFleetShipsDataSelectorFactory = _.memoize(fleetId =>
  createSelector([
    fleetShipsDataSelectorFactory(fleetId),
  ], (shipsData = []) =>
    shipsData.filter(([_ship, $ship]) => !!_ship && !!$ship)
      .map(([_ship, $ship]) => ({ ...$ship, ..._ship }))
  )
)

const normalizedFleetShipsEquipDataSelectorFactory = _.memoize(fleetId =>
  createSelector([
    fleetShipsEquipDataSelectorFactory(fleetId),
  ], (equipsData = []) =>
    equipsData.map(equipData =>
      equipData.filter(([_equip, $equip, onslot] = []) => !!_equip && !!$equip)
        .map(([_equip, $equip, onslot]) => ([{ ...$equip, ..._equip }, onslot]))
    )
  )
)

const escapedShipIdSelector = createSelector([
  state => _.get(state, 'sortie.escapedPos', []),
  state => _.get(state, 'sortie.combinedFlag', 0),
  state => state,
], (escapedPos, combinedFlag, state) => {
  if (combinedFlag > 0) {
    const shipIds = _.flatMap([0, 1], fleetId => _.get(state, `info.fleets.${fleetId}.api_ship`)) // -1 for no ship, considered safe
    return escapedPos.map(pos => shipIds[pos])
  }
  return [] // because you could only escape in combined fleet
})

const combinedFleetTPSelector = createSelector([
  normalizedFleetShipsDataSelectorFactory(0),
  normalizedFleetShipsEquipDataSelectorFactory(0),
  normalizedFleetShipsDataSelectorFactory(1),
  normalizedFleetShipsEquipDataSelectorFactory(1),
  inEventSelector,
  escapedShipIdSelector,
], (ships0, equips0, ships1, equips1, inEvent, escapedShipIds) => (
  inEvent
    ? getTransportPoint([...ships0, ...ships1], [...equips0, ...equips1], escapedShipIds)
    : 0
))

const fleetTPSelectorFactory = _.memoize(fleetId =>
  createSelector([
    normalizedFleetShipsDataSelectorFactory(fleetId),
    normalizedFleetShipsEquipDataSelectorFactory(fleetId),
    inEventSelector,
  ], (shipsData, equipsData, inEvent) =>
    (inEvent ? getTransportPoint(shipsData, equipsData, []) : 0)
  )
)

const BattleViewArea = connect(
  (state, props) => {
    const sortie = state.sortie || {}
    const { sortieMapId, currentNode, combinedFlag, sortieStatus } = sortie
    const showEnemyTitle = _.get(state, 'config.plugin.prophet.showEnemyTitle', true)
    const spot = props.sortieState == 3 ? 'practice' : `${sortieMapId}-${currentNode}`
    let enemyTitle = props.sortieState == 3 ? 'PvP' : 'Enemy Vessel'
    enemyTitle = showEnemyTitle
      ? _.get(extensionSelectorFactory(PLUGIN_KEY)(state), `${spot}.title`, enemyTitle)
      : enemyTitle

    let friendTitle = 'Sortie Fleet'
    let TP = {
      total: 0,
      actual: 0,
    }
    if (showEnemyTitle) {
      if (combinedFlag > 0) {
        friendTitle = combinedFleetType[combinedFlag] || 'Combined Fleet'
        TP = combinedFleetTPSelector(state)
      } else {
        const fleetId = (sortieStatus || []).findIndex(a => a)
        TP = fleetTPSelectorFactory(fleetId === -1 ? 0 : fleetId)(state)
        friendTitle = _.get(state, `info.fleets.${fleetId === -1 ? 0 : fleetId}.api_name`, 'Sortie Fleet')
      }
    }
    friendTitle = props.isBaseDefense ? 'Land Base' : friendTitle

    return {
      layout: _.get(state, 'config.poi.layout', 'horizontal'),
      doubleTabbed: _.get(state, 'config.poi.tabarea.double', false),
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
      spotKind: props.spotKind,
      result: props.result,
      battleForm: props.battleForm,
      eFormation: props.eFormation,
      enemyTitle,
      friendTitle,
      TP,
    }
  }
)(({
  layout,
  doubleTabbed,
  ecGameOrder,
  mainFleet = [],
  escortFleet = [],
  enemyFleet = [],
  enemyEscort = [],
  landBase = [],
  airForce = [], // [count, lostCount, enemyCount, enemyLostCount]
  airControl = 0,
  isBaseDefense,
  sortieState = 0,
  spotKind = '',
  result = {},
  battleForm = '',
  eFormation = '',
  enemyTitle,
  friendTitle,
  TP,
  }) => {
  const View = isBaseDefense ? SquadView : ShipView
  const times = layout == 'horizontal' ? 1 : 2
  const useVerticalLayout = !doubleTabbed && layout !== 'horizontal'
  // adapt the view according to layout by setting FleetView's div xs = 12/count
  // this can support 12v6, 6v12 and 12v12
  const fleetCount = 1 && _.sumBy([mainFleet, escortFleet], fleet => fleet != null)
  const enemyCount = 1 && _.sumBy([enemyFleet, enemyEscort], fleet => fleet != null)
  const fleetWidth = escortFleet && !isBaseDefense ? 2 : 1
  const enemyWidth = enemyEscort && !isBaseDefense ? 2 : 1
  const { getShip, getItem } = _.pick(result, ['getShip', 'getItem'])
  const alliedForce =
    (<div className="div-row">
      <FleetView fleet={isBaseDefense ? landBase : mainFleet} title={__('Main Fleet')} count={times * fleetCount} View={View} />
      <FleetView fleet={isBaseDefense ? undefined : escortFleet} title={__('Escort Fleet')} count={times * fleetCount} View={View} />
    </div>)
  const enemyForce = sortieState > 1 || isBaseDefense ?
    (<div className="div-row" style={{ flexDirection: ecGameOrder ? 'row-reverse' : 'row' }}>
      <FleetView fleet={enemyFleet} title={__('Enemy Fleet')} count={times * enemyCount} />
      <FleetView fleet={enemyEscort} title={__('Enemy Escort Fleet')} count={times * enemyCount} />
    </div>) : <noscript />
  const combatInfo = (TP.total > 0 || sortieState > 1 || isBaseDefense) && (
    <div className="alert div-row prophet-info">
      <div className="combat-title" title={__(friendTitle)}>
        <span>{`${__(friendTitle)}`}</span>
        {
          TP.total > 0 && (!isBaseDefense) &&
          <span style={{ marginLeft: '1ex', marginRight: '1ex' }}>
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id="tp-indicator">
                  <span>
                    {`${__('A rank: ')}${Math.floor(TP.actual * 0.7)}`}
                  </span>
                </Tooltip>
              }
            >
              <span>
                <FontAwesome name="database" style={{ marginRight: '1ex' }} />
                [
                { TP.total != TP.actual && <span>{`${TP.actual} / `}</span> }
                <span>{TP.total}</span>
                ]
              </span>
            </OverlayTrigger>
          </span>
        }
        {
          airForce[0] ?
            <span>
              <FontAwesome name="plane" style={{ marginRight: '1ex' }} />
              {`[${airForce[0] - airForce[1]} / ${airForce[0]}]`}
            </span> : ''
        }
      </div>
      <div className="combat-vs" style={{ opacity: (sortieState > 1 || isBaseDefense) ? 1 : 0 }}>vs</div>
      {
        (sortieState > 1 || isBaseDefense)
          ? <div className="combat-title" title={__(enemyTitle)}>
            {
              airForce[2] ?
                <span>
                  <FontAwesome name="plane" />
                  {` [${airForce[2] - airForce[3]} / ${airForce[2]}]`}
                </span> : ''
            }
            {` ${__(enemyTitle)}`}
          </div>
          : <div className="combat-title" />
      }
    </div>
  )
  const battleInfo =
    (
      <BattleInfo
        result={result && result.rank}
        eFormation={eFormation}
        battleForm={battleForm}
        airControl={airControl}
      />
    )
  const mapInfo =
    (<div className="alert prophet-info">
      {
        sortieState === 1 && !isBaseDefense ?
          <NextSpotInfo spotKind={spotKind} />
        : isBaseDefense ?
        [
          battleInfo,
          <NextSpotInfo spotKind={spotKind} />,
        ]
        : (getShip || getItem) ?
          <DropInfo
            getShip={getShip}
            getItem={getItem}
          />
        : sortieState > 1 || isBaseDefense ?
          battleInfo
        : <noscript />
      }
    </div>)
  return (
    <div id="overview-area">
      {useVerticalLayout ? combatInfo : null}
      <div className={useVerticalLayout ? 'div-row' : ''}>
        <div className="fleet-container" style={{ flex: useVerticalLayout ? fleetWidth : 1, flexDirection: useVerticalLayout && (escortFleet || []).length && !isBaseDefense ? 'column-reverse' : 'column' }}>
          {alliedForce}
          {!useVerticalLayout ? combatInfo : null}
        </div>
        <div className="fleet-container" style={{ flex: useVerticalLayout ? enemyWidth : 1, flexDirection: useVerticalLayout && (enemyEscort || []).length ? 'column-reverse' : 'column' }}>
          {enemyForce}
          {!useVerticalLayout ? mapInfo : null}
        </div>
      </div>
      {useVerticalLayout ? mapInfo : null}
    </div>
  )
})

export default BattleViewArea
