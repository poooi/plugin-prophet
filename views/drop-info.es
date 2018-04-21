import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import _ from 'lodash'
import FA from 'react-fontawesome'

const { i18n, ipc } = window
const __ = window.i18n['poi-plugin-prophet'].__.bind(window.i18n['poi-plugin-prophet'])


const DropInfo = connect((state, props) => {
  const ship = _.get(state, `const.$ships.${props.getShip}`)
  const item = _.get(state, `const.$useitems.${props.getItem}`)
  const shipType = _.get(state, `const.$shipTypes.${(ship || {}).api_stype}`)
  const navyAlbumShowShipAvailable = _.get(state, 'ipc.NavyAlbum.showShip', false)

  return {
    ship,
    item,
    shipType,
    navyAlbumShowShipAvailable,
  }
})(class DropInfo extends PureComponent {
  static propTypes = {
    ship: PropTypes.shape({
      api_id: PropTypes.number,
    }).isRequired,
    item: PropTypes.shape({
      api_id: PropTypes.number,
    }).isRequired,
    shipType: PropTypes.objectOf(PropTypes.object).isRequired,
    navyAlbumShowShipAvailable: PropTypes.bool.isRequired,
  }

  handleClick = () => {
    const { showShip } = ipc.access('NavyAlbum')
    const { ship } = this.props
    showShip(ship.api_id)
  }

  render() {
    const {
      ship, item, shipType, navyAlbumShowShipAvailable,
    } = this.props
    const shipMessage = ship &&
      __('%s "%s" joined your fleet', i18n.resources.__(shipType.api_name), i18n.resources.__(ship.api_name))
    const itemMessage = item &&
      __('Item "%s" got', i18n.resources.__(item.api_name))

    const shipComponent = shipMessage && (
      navyAlbumShowShipAvailable ? (
        <button
          bsStyle="link"
          onClick={this.handleClick}
          key="ship"
          style={{
            backgroundColor: 'initial',
            border: 0,
            outline: 'none',
          }}
        >
          {shipMessage} <FA name="info-circle" />
        </button>
      ) : (
        <span
          key="ship"
        >
          {shipMessage}
        </span>
      )
    )

    const itemComponent = itemMessage && (
      <span key="item">{itemMessage}</span>
    )

    const components = _.compact([shipComponent, itemComponent])

    return (
      <span className="drop-info">
        {
          _.flatMap(
            components, (c, ind) =>
              ind + 1 === components.length
                ? [c]
                : [c, <span key={`sep-${ind}`}> | </span>]
          )
        }
      </span>
    )
  }
})

export default DropInfo
