import React, { FC, useRef, useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import styled from 'styled-components'

import BattleViewArea from './views/battle-view-area'
import { getAutoLayout } from './utils'
import { battleStateSelector } from './redux'
import { computeFleetIds } from './selectors'

const Container = styled.div`
  padding: 4px 8px;
  height: 100%;
  overflow: scroll;
`

export const Prophet: FC = () => {
  const battleState = useSelector(battleStateSelector)
  const fleetIds = useSelector(computeFleetIds, shallowEqual)
  const layout = useSelector(
    (state: PoiRootState) => state.config?.plugin?.prophet?.layout ?? 'auto',
  )

  const [viewSize, setViewSize] = useState({ width: 500, height: 400 })
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resizeObserver = new window.ResizeObserver(([{ contentRect }]: ResizeObserverEntry[]) => {
      const { width, height } = contentRect
      setViewSize({ width, height })
    })
    if (rootRef.current) {
      resizeObserver.observe(rootRef.current)
    }
    return () => {
      if (rootRef.current) {
        resizeObserver.unobserve(rootRef.current)
      }
    }
  }, [])

  const {
    mainFleet,
    escortFleet,
    enemyFleet,
    enemyEscort,
    landBase,
    airForce,
    airControl,
    isBaseDefense,
    isHeavyBomberDefense,
    sortieState,
    eventId,
    eventKind,
    result,
    battleForm,
    eFormation,
    smokeType,
  } = battleState
  const { width, height } = viewSize
  const finalLayout = layout === 'auto' ? getAutoLayout(width, height) : layout

  return (
    <Container id="plugin-prophet" ref={rootRef}>
      <BattleViewArea
        mainFleet={mainFleet}
        escortFleet={escortFleet}
        enemyFleet={enemyFleet ?? undefined}
        enemyEscort={enemyEscort ?? undefined}
        landBase={landBase}
        airForce={airForce}
        airControl={airControl}
        isBaseDefense={isBaseDefense}
        isHeavyBomberDefense={isHeavyBomberDefense}
        sortieState={sortieState}
        eventId={eventId}
        eventKind={eventKind}
        result={result}
        battleForm={battleForm}
        eFormation={eFormation}
        fleetIds={fleetIds}
        horizontalLayout={finalLayout === 'horizontal'}
        root={rootRef.current}
        smokeType={smokeType}
      />
    </Container>
  )
}
