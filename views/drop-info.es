import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

const { i18n, ipc } = window
const __ = window.i18n['poi-plugin-prophet'].__.bind(window.i18n['poi-plugin-prophet'])


const DropInfo = connect((state, props) => {
  const ship = _.get(state, `const.$ships.${props.getShip}`)
  const item = _.get(state, `const.$useitems.${props.getItem}`)
  const shipType = _.get(state, `const.$shipTypes.${(ship || {}).api_stype}`)
  const navyAlbumShowShipAvailable = _.get(state, 'ipc.NavyAlbum.showShip', false)
  const showShip = navyAlbumShowShipAvailable ? ipc.access('NavyAlbum').showShip : null

  return {
    ship,
    item,
    shipType,
    showShip,
  }
})(({ ship, item, shipType, showShip }) => {
  const shipMessage = ship &&
    __('%s "%s" joined your fleet', i18n.resources.__(shipType.api_name), i18n.resources.__(ship.api_name))
  const itemMessage = item &&
    __('Item "%s" got', i18n.resources.__(item.api_name))

  const shipComponent = shipMessage && (
    showShip ? (
      <a
        role="link"
        tabIndex={-1}
        onClick={() => showShip(ship.api_id)}
        key={`ship-${ship.api_id}`}
      >
        {shipMessage}
      </a>
    ) : (
      <span
        key={`ship-${ship.api_id}`}
      >
        {shipMessage}
      </span>
    )
  )

  const itemComponent = itemMessage && (
    <span key={`item-${item.api_id}`}>{itemMessage}</span>
  )

  const components = _.compact([shipComponent, itemComponent])

  return (
    <span className="drop-info">
      {
        _.flatMap(
          components,
          // eslint-disable-next-line no-confusing-arrow
          (c, ind) =>
            // add seperator if current element is not the last one
            ind + 1 === components.length ?
              [c] : [c, <span key={`sep-${ind}`}>{' | '}</span>]
        )
      }
    </span>
  )
})

export default DropInfo
