import React from 'react'

import ShipView from './ship-view'

// const { i18n } = window
// const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])


const FleetView = ({ fleet, View = ShipView }) => {
  if (!(fleet && fleet.length > 0)) {
    return <div />
  }

  return (
    <div className="fleet-view">
      <div>
        {fleet.map((ship, i) =>
          ship && <View ship={ship} key={ship.pos || 0} />
      )}
      </div>
    </div>
  )
}

export default FleetView
