import React from 'react'
import PropTypes from 'prop-types'
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
        {fleet.map(ship =>
          ship && <View ship={ship} key={ship.pos || 0} />
      )}
      </div>
    </div>
  )
}

FleetView.propTypes = {
  fleet: PropTypes.arrayOf(PropTypes.object),
  View: PropTypes.func,
}

export default FleetView
