import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { map, get } from 'lodash'
import cls from 'classnames'

import ShipView from './ship-view'

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

  componentDidMount = () => {
    this.observer = new window.ResizeObserver(this.handleResize)
    this.observer.observe(this.container)
  }

  componentWillUnmount = () => {
    this.observer.unobserve(this.container)
  }

  handleResize = ([entry]) => {
    if (!this.props.root) {
      setTimeout(() => this.handleResize([entry]), 500)
      return
    }
    const {
      top,
      left,
      right,
    } = this.props.root.parentElement.parentElement.parentElement.getBoundingClientRect()
    const compact = entry.contentRect.width < 250
    let tooltipPos
    if (left >= 200) {
      tooltipPos = 'left'
    } else if (
      this.props.root.offsetParent.clientWidth -
        right +
        entry.contentRect.width / 2 >=
      200
    ) {
      tooltipPos = 'right'
    } else if (top >= 150) {
      tooltipPos = 'top'
    } else {
      tooltipPos = 'bottom'
    }
    if (
      compact !== this.state.compact ||
      tooltipPos !== this.state.tooltipPos
    ) {
      this.setState({ compact, tooltipPos })
    }
  }

  render() {
    const { fleet, View = ShipView } = this.props

    const { compact, tooltipPos } = this.state

    return (
      <div
        className={cls({ 'fleet-view': Boolean(get(fleet, 'length')) })}
        ref={ref => {
          this.container = ref
        }}
      >
        <div>
          {map(
            fleet,
            ship =>
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
      </div>
    )
  }
}

export default FleetView
