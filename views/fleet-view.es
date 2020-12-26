import React, { PureComponent, createRef } from 'react'
import PropTypes from 'prop-types'
import { map, size } from 'lodash'
import cls from 'classnames'
import styled from 'styled-components'

import ShipView from './ship-view'

const Container = styled.div`
  flex: ${(props) => (props.visible ? 1 : 0)};
  padding: 0 ${(props) => (props.visible ? 5 : 0)}px;
  width: 50%;
`

class FleetView extends PureComponent {
  static propTypes = {
    fleet: PropTypes.arrayOf(PropTypes.object),
    View: PropTypes.func,
    root: PropTypes.node,
  }

  state = {
    compact: false,
    tooltipPos: 'left',
  }

  container = createRef()

  componentDidMount = () => {
    this.observer = new window.ResizeObserver(this.handleResize)
    this.observer.observe(this.container.current)
  }

  componentWillUnmount = () => {
    this.observer.unobserve(this.container.current)
  }

  handleResize = ([entry]) => {
    const { root } = this.props
    const { compact: stateCompact, tooltipPos: stateTooltipPos } = this.state
    if (!root) {
      setTimeout(() => this.handleResize([entry]), 500)
      return
    }
    if (!root.offsetParent) {
      return
    }
    const {
      top,
      left,
      right,
    } = root.parentElement.parentElement.parentElement.getBoundingClientRect()
    const compact = entry.contentRect.width < 250
    let tooltipPos
    if (left >= 200) {
      tooltipPos = 'left'
    } else if (
      root.offsetParent.clientWidth - right + entry.contentRect.width / 2 >=
      200
    ) {
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

  render() {
    const { fleet, View = ShipView } = this.props

    const { compact, tooltipPos } = this.state

    return (
      <Container
        visible={Boolean(size(fleet))}
        ref={this.container}
        className={cls('fleet-view', {
          visible: size(fleet),
        })}
      >
        <div>
          {map(
            fleet,
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
}

export default FleetView
