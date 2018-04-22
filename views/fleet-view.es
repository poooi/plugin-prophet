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
  }

  componentDidMount = () => {
    this.observer = new window.ResizeObserver(this.handleResize)
    this.observer.observe(this.container)
  }

  componentWillUnmount = () => {
    this.observer.unobserve(this.container)
  }

  handleResize = ([entry]) => {
    const compact = entry.contentRect.width < 250
    if (compact !== this.state.compact) {
      this.setState({ compact })
    }
  }

  render() {
    const { fleet, View = ShipView } = this.props

    const { compact } = this.state

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
                <View ship={ship} key={ship.pos || 0} compact={compact} />
              ),
          )}
        </div>
      </div>
    )
  }
}

export default FleetView
