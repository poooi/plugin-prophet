import React, { Component } from 'react'

import ShipView from './ship-view'

// const { i18n } = window
// const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

export default class FleetView extends Component {
  static defaultProps = {
    count: 1,
    fleet: {},
    title: '',
    View: null,
  }

  render() {
    const { fleet } = this.props
    let { View } = this.props
    if (!(fleet && fleet.length > 0)) {
      return <div />
    }
    if (View == null) {
      View = ShipView
    }
    return (
      <div className="fleet-view">
        <div>
          {fleet.map((ship, i) =>
            <View child={ship} key={(ship || {}).pos || 0} />
        )}
        </div>
      </div>
    )
  }
}
