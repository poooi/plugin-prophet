import React, { PureComponent, createRef } from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { FleetColumn } from './fleet-column'
import { BattleSummary } from './battle-summary'
import { DropInfo } from './drop-info'
import { NextSpotInfo } from './next-spot-info'
import { LandBaseSquad } from './land-base-squad'
import type { PoiRootState } from '../../host/poi-types'
import type {
  ProphetViewModel,
  FleetGroupViewModel,
  AirForceViewModel,
} from '../../battle/battle-view-model'
import { SortieState } from '../../battle/battle-view-model'

const BattleView = styled.div`
  width: 100%;
  padding: 8px;
`

const FleetRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const SummaryRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 4px;
`

const AirForceRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 4px;
`

const AirForceCell = styled.div`
  min-width: 6em;
`

const LandBaseRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`

const StatusRow = styled.div`
  text-align: center;
  margin-top: 8px;
`

interface AirForceProps {
  airForce: AirForceViewModel
  label: string
}

const AirForce: React.FC<AirForceProps> = ({ airForce, label }) => {
  return (
    <AirForceCell>
      {label}: {airForce.fInit - airForce.fLost}/{airForce.fInit}
      {' - '}
      {airForce.eInit - airForce.eLost}/{airForce.eInit}
    </AirForceCell>
  )
}

interface FleetGroupProps {
  group: FleetGroupViewModel
  root?: HTMLElement | null
}

const FleetGroup: React.FC<FleetGroupProps> = ({ group, root }) => {
  const { t } = useTranslation('poi-plugin-prophet')

  if (!group) return null

  return (
    <div className={`fleet-group${group.isBaseDefense ? ' base-defense' : ''}`}>
      <FleetRow>
        {group.main && <FleetColumn ships={group.main.ships} root={root} />}
        {group.escort && <FleetColumn ships={group.escort.ships} root={root} />}
      </FleetRow>
      {group.airForce && (
        <AirForceRow>
          <AirForce airForce={group.airForce} label={t('Air')} />
        </AirForceRow>
      )}
      {group.transport && (
        <div>
          TP: {group.transport.actual} / {group.transport.total}
        </div>
      )}
    </div>
  )
}

interface AirBaseSquad {
  id: number
  planes: Array<{ count: number; name: string; iconId: number; max: number; now: number }>
}

interface BattlePanelOwnProps {
  viewModel: ProphetViewModel | null
  airBaseSquads: AirBaseSquad[]
}

interface BattlePanelStateProps {
  isDarkTheme: boolean
}

class BattlePanelInner extends PureComponent<BattlePanelOwnProps & BattlePanelStateProps> {
  container = createRef<HTMLDivElement>()

  override render() {
    const { viewModel, isDarkTheme, airBaseSquads } = this.props

    if (!viewModel) {
      return <BattleView ref={this.container} />
    }

    const { sortieState, allied, enemy, summary, map, drop } = viewModel

    const showBattle = sortieState === SortieState.Battle || sortieState === SortieState.Practice

    return (
      <BattleView ref={this.container}>
        {showBattle && summary && (
          <SummaryRow>
            <BattleSummary
              rank={summary.rank}
              eFormation={summary.eFormation}
              battleForm={summary.battleForm}
              airControl={summary.airControl}
              smokeType={summary.smokeType}
              isDarkTheme={isDarkTheme}
            />
          </SummaryRow>
        )}

        <FleetRow>
          {allied && <FleetGroup group={allied} root={this.container.current} />}
          {enemy && <FleetGroup group={enemy} root={this.container.current} />}
        </FleetRow>

        {airBaseSquads.length > 0 && (
          <LandBaseRow>
            {airBaseSquads.map((squad) => (
              <LandBaseSquad key={squad.id} squadId={squad.id} planes={squad.planes} />
            ))}
          </LandBaseRow>
        )}

        {map && (
          <StatusRow>
            <NextSpotInfo
              eventId={map.eventId}
              eventKind={map.eventKind}
              isHeavyBomberDefense={map.isHeavyBomberDefense}
            />
          </StatusRow>
        )}

        {drop && (
          <StatusRow>
            <DropInfo shipId={drop.shipId} itemId={drop.itemId} />
          </StatusRow>
        )}
      </BattleView>
    )
  }
}

export const BattlePanel = connect(
  (state: PoiRootState): BattlePanelStateProps => ({
    isDarkTheme: get(state, 'config.poi.appearance.theme', 'dark') === 'dark',
  }),
)(BattlePanelInner)

