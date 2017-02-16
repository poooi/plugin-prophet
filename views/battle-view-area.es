import FontAwesome from 'react-fontawesome'
import React from 'react'
import _ from 'lodash'
import { connect } from 'react-redux'

import { extensionSelectorFactory } from 'views/utils/selectors'

import ShipView from './ship-view'
import FleetView from './fleet-view'
import SquadView from './squad-view'
import BattleInfo from './battle-info'
import DropInfo from './drop-info'
import NextSpotInfo from './next-spot-info'
import { PLUGIN_KEY, combinedFleetType } from '../utils'

const { i18n } = window
const __ = i18n['poi-plugin-prophet'].__.bind(i18n['poi-plugin-prophet'])

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
    if (showEnemyTitle) {
      if (combinedFlag > 0) {
        friendTitle = combinedFleetType[combinedFlag] || 'Combined Fleet'
      } else {
        const fleetId = (sortieStatus || []).findIndex(a => a)
        friendTitle = _.get(state, `info.fleets.${fleetId}.api_name`, 'Sortie Fleet')
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
    }
  }
)((layout,
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
  friendTitle) => {
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
  const combatInfo = sortieState > 1 || isBaseDefense ?
    (<div className="alert div-row prophet-info">
      <div style={{ flex: 1 }}>
        {`${__(friendTitle)} `}
        {
          airForce[0] ?
            <span>
              <FontAwesome name="plane" />
              {` [${airForce[0] - airForce[1]} / ${airForce[0]}]`}
            </span> : ''
        }
      </div>
      <div style={{ flex: 0 }}>vs</div>
      <div style={{ flex: 1 }}>
        {
          airForce[2] ?
            <span>
              <FontAwesome name="plane" />
              {` [${airForce[2] - airForce[3]} / ${airForce[2]}]`}
            </span> : ''
        }
        {` ${__(enemyTitle)}`}
      </div>
    </div>) : <noscript />
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
          <span> | </span>,
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
