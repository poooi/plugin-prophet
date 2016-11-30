const __ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])

import React, { Component, PropTypes } from 'react'
import _ from 'lodash'
const { i18n } =window


export default class DropInfo extends Component {
  static propTypes = {
    getShip: PropTypes.number.isRequired,
    getItem: PropTypes.number.isRequired,
  }

  static defaultProps = {
    getShip: -1,
    getItem: -1,
  }

  render(){
    const {getShip, getItem} = this.props
    let ship = _.get(window.$ships, getShip)
    let item = _.get(window.$slotitems, getItem)
    let shipMessage = ship != null ?
      __("%s \"%s\" joined your fleet", i18n.resources.__(window.$shipTypes[ship.api_stype].api_name), i18n.resources.__(ship.api_name))
      : ''
    let itemMessage = item != null ? __("Item \"%s:\" got! ", i18n.resources.__(item.api_name)) : ''
    return (
      <span className="drop-info">
        {`${shipMessage} ${itemMessage}`}
      </span>
    )
  }
}
