import React, { PureComponent, createRef } from 'react'
import styled from 'styled-components'
import classnames from 'classnames'
import { ShipCard } from './ship-card'
import type { ShipViewModel } from '../../battle/battle-view-model'

const Container = styled.div<{ visible: boolean }>`
  flex: ${(props) => (props.visible ? 1 : 0)};
  padding: 0 ${(props) => (props.visible ? 5 : 0)}px;
  width: 50%;
`

interface FleetColumnProps {
  ships: ShipViewModel[]
  root?: HTMLElement | null
  View?: React.ComponentType<{ ship: ShipViewModel; compact?: boolean; tooltipPos?: string }>
}

interface FleetColumnState {
  compact: boolean
  tooltipPos: string
}

export class FleetColumn extends PureComponent<FleetColumnProps, FleetColumnState> {
  override state: FleetColumnState = {
    compact: false,
    tooltipPos: 'left',
  }

  container = createRef<HTMLDivElement>()
  private _observer: ResizeObserver | null = null

  override componentDidMount() {
    this._observer = new window.ResizeObserver(this._handleResize)
    if (this.container.current) {
      this._observer.observe(this.container.current)
    }
  }

  override componentWillUnmount() {
    if (this.container.current && this._observer) {
      this._observer.unobserve(this.container.current)
    }
  }

  _handleResize = (entries: ResizeObserverEntry[]) => {
    const entry = entries[0]
    if (!entry) return
    const { root } = this.props
    const { compact: stateCompact, tooltipPos: stateTooltipPos } = this.state

    if (!root) {
      setTimeout(() => this._handleResize(entries), 500)
      return
    }
    if (!root.offsetParent) return

    const { top, left, right } = root.parentElement!.parentElement!.parentElement!.getBoundingClientRect()
    const compact = entry.contentRect.width < 250
    let tooltipPos: string
    if (left >= 200) {
      tooltipPos = 'left'
    } else if (root.offsetParent.clientWidth - right + entry.contentRect.width / 2 >= 200) {
      tooltipPos = 'right'
    } else if (top >= 150) {
      tooltipPos = 'top'
    } else {
      tooltipPos = 'bottom'
    }

    if (compact !== stateCompact || tooltipPos !== stateTooltipPos) {
      this.setState({ compact, tooltipPos })
    }
  }

  override render() {
    const { ships, View = ShipCard as unknown as NonNullable<FleetColumnProps['View']> } = this.props
    const { compact, tooltipPos } = this.state
    const visible = ships.length > 0

    return (
      <Container
        visible={visible}
        ref={this.container}
        className={classnames('fleet-view', { visible })}
      >
        <div>
          {ships.map((ship) => (
            <View
              key={ship.key}
              ship={ship}
              compact={compact}
              tooltipPos={tooltipPos}
            />
          ))}
        </div>
      </Container>
    )
  }
}
