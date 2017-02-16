import React from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'

const { i18n } = window
const __ = window.i18n['poi-plugin-prophet'].__.bind(window.i18n['poi-plugin-prophet'])


const DropInfo = connect((state, props) => {
  const ship = _.get(state, `const.$ships.${props.getShip}`)
  const item = _.get(state, `const.$equips.${props.getItem}`)
  const shipType = _.get(state, `const.$shipTypes.${ship.api_stype}`)
  return {
    ship,
    item,
    shipType,
  }
})(({ ship, item, shipType }) => {
  const shipMessage = ship != null ?
    __('%s "%s" joined your fleet', i18n.resources.__(shipType.api_name), i18n.resources.__(ship.api_name))
    : ''
  const itemMessage = item != null ? __('Item "%s:" got! ', i18n.resources.__(item.api_name)) : ''
  return (
    <span className="drop-info">
      {`${shipMessage} ${itemMessage}`}
    </span>
  )
})

export default DropInfo
