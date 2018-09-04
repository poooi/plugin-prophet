import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { map, get } from 'lodash'
import cls from 'classnames'

import ShipView from './ship-view'

class FleetView extends PureComponent {
  static propTypes = {
    fleet: PropTypes.arrayOf(PropTypes.object),
    View: PropTypes.func,
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
    const { top, left, right } = $('#poi-plugin-prophet').parentElement.parentElement.getBoundingClientRect()
    const compact = entry.contentRect.width < 250
    const tooltipPos = left >= 200 ? 'left'
      : window.innerWidth - right + entry.contentRect.width / 2 >= 200 ? 'right'
      : top >= 150 ? 'top' : 'bottom'
    if (compact !== this.state.compact || tooltipPos !== this.state.tooltipPos) {
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
                <View ship={ship} key={ship.pos || 0} compact={compact} tooltipPos={tooltipPos} />
              ),
          )}
        </div>
      </div>
    )
  }
}

export default FleetView
