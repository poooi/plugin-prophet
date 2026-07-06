import React, { FC, useRef, useState, useEffect } from 'react'
import { size } from 'lodash'
import cls from 'classnames'
import styled from 'styled-components'
import type { Ship } from 'poi-lib-battle'

import ShipView from './ship-view'

const Container = styled.div<{ visible: boolean }>`
  flex: ${(props) => (props.visible ? 1 : 0)};
  padding: 0 ${(props) => (props.visible ? 5 : 0)}px;
  width: 50%;
`

interface FleetViewProps {
  fleet?: (Ship | null)[]
  View?: FC<{ ship: Ship; compact?: boolean; tooltipPos?: string }>
  root?: Element | null
  title?: string
  count?: number
}

const FleetView: FC<FleetViewProps> = ({ fleet, View = ShipView, root }) => {
  const [compact, setCompact] = useState(false)
  const [tooltipPos, setTooltipPos] = useState<string>('left')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const handleResize = ([entry]: ResizeObserverEntry[]) => {
      if (!root) {
        setTimeout(() => handleResize([entry]), 500)
        return
      }
      if (!(root as HTMLElement).offsetParent) return

      const { top, left, right } =
        root.parentElement!.parentElement!.parentElement!.getBoundingClientRect()
      const nextCompact = entry.contentRect.width < 250
      let nextTooltipPos: string
      if (left >= 200) {
        nextTooltipPos = 'left'
      } else if (
        (root as HTMLElement).offsetParent!.clientWidth - right + entry.contentRect.width / 2 >=
        200
      ) {
        nextTooltipPos = 'right'
      } else if (top >= 150) {
        nextTooltipPos = 'top'
      } else {
        nextTooltipPos = 'bottom'
      }
      if (nextCompact !== compact || nextTooltipPos !== tooltipPos) {
        setCompact(nextCompact)
        setTooltipPos(nextTooltipPos)
      }
    }

    const observer = new window.ResizeObserver(handleResize)
    observer.observe(container)
    return () => observer.unobserve(container)
  }, [root, compact, tooltipPos])

  return (
    <Container
      visible={Boolean(size(fleet))}
      ref={containerRef}
      className={cls('fleet-view', { visible: size(fleet) })}
    >
      <div>
        {(fleet ?? []).map(
          (ship) =>
            ship && (
              <View
                ship={ship}
                key={ship.pos || 0}
                compact={compact}
                tooltipPos={tooltipPos}
              />
            ),
        )}
      </div>
    </Container>
  )
}

export default FleetView
