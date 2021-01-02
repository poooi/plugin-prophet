import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import _ from 'lodash'
import FA from 'react-fontawesome'
import { withNamespaces } from 'react-i18next'

const { ipc } = window

@withNamespaces(['poi-plugin-prophet', 'resources'], { nsMode: 'fallback' })
@connect((state, props) => {
  const ship = _.get(state, `const.$ships.${props.getShip}`)
  const item = _.get(state, `const.$useitems.${props.getItem}`)
  const shipType = _.get(state, `const.$shipTypes.${(ship || {}).api_stype}`)
  const navyAlbumShowShipAvailable = _.get(
    state,
    'ipc.NavyAlbum.showShip',
    false,
  )
  const count = _.get(
    state,
    ['ext', 'poi-plugin-prophet', '_', 'useitem', props.getItem, 'api_count'],
    0,
  )

  return {
    ship,
    item,
    shipType,
    navyAlbumShowShipAvailable,
    count,
  }
})
class DropInfo extends PureComponent {
  static propTypes = {
    ship: PropTypes.shape({
      api_id: PropTypes.number,
      api_name: PropTypes.string,
    }),
    item: PropTypes.shape({
      api_id: PropTypes.number,
      api_name: PropTypes.string,
    }),
    shipType: PropTypes.objectOf(PropTypes.object),
    navyAlbumShowShipAvailable: PropTypes.bool.isRequired,
    t: PropTypes.func.isRequired,
    count: PropTypes.number,
  }

  handleClick = () => {
    const { showShip } = ipc.access('NavyAlbum')
    const { ship } = this.props
    showShip(ship.api_id)
    const mainWindow = ipc.access('MainWindow')
    if (mainWindow && mainWindow.ipcFocusPlugin) {
      mainWindow.ipcFocusPlugin('poi-plugin-navy-album')
    }
  }

  render() {
    const {
      ship,
      item,
      shipType,
      navyAlbumShowShipAvailable,
      t,
      count,
    } = this.props
    const shipMessage =
      ship &&
      t('{{type}} "{{ship}}" joined your fleet', {
        type: t(shipType.api_name),
        ship: t(ship.api_name),
      })
    const itemMessage =
      item && t('Useitem_got', { item: t(item.api_name), count })

    const shipComponent =
      shipMessage &&
      (navyAlbumShowShipAvailable ? (
        <button
          bsStyle="link"
          type="button"
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
        <span key="ship">{shipMessage}</span>
      ))

    const itemComponent = itemMessage && <span key="item">{itemMessage}</span>

    const components = _.compact([shipComponent, itemComponent])

    return (
      <span className="drop-info">
        {_.flatMap(components, (c, ind) =>
          ind + 1 === components.length
            ? [c]
            : [c, <span key={`sep-${ind}`}> | </span>],
        )}
      </span>
    )
  }
}

export default DropInfo
