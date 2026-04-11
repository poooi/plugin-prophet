import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import _ from 'lodash'
import FA from 'react-fontawesome'
import { useTranslation } from 'react-i18next'

interface DropInfoProps {
  getShip?: number
  getItem?: number
}

const DropInfo: FC<DropInfoProps> = ({ getShip, getItem }) => {
  const { t } = useTranslation(['poi-plugin-prophet', 'resources'])

  const ship = useSelector((state: PoiRootState) => state.const?.$ships?.[getShip ?? -1])
  const item = useSelector((state: PoiRootState) => state.const?.$useitems?.[getItem ?? -1])
  const shipType = useSelector((state: PoiRootState) =>
    ship ? state.const?.$shipTypes?.[ship.api_stype] : undefined,
  )
  const navyAlbumShowShipAvailable = useSelector(
    (state: PoiRootState) => state.ipc?.NavyAlbum?.showShip ?? false,
  )
  const count = useSelector((state: PoiRootState) => {
    const useitemStore = state.ext?.['poi-plugin-prophet']?._?.['useitem']
    if (!useitemStore || getItem == null) return 0
    return ((useitemStore as Record<string, Record<string, unknown>>)[String(getItem)]?.api_count as number | undefined) ?? 0
  })

  const handleClick = () => {
    if (!window.ipc || !ship) return
    const navyAlbum = window.ipc.access('NavyAlbum')
    navyAlbum.showShip(ship.api_id)
    const mainWindow = window.ipc.access('MainWindow')
    if (mainWindow?.ipcFocusPlugin) {
      mainWindow.ipcFocusPlugin('poi-plugin-navy-album')
    }
  }

  const shipMessage =
    ship &&
    shipType &&
    t('{{type}} "{{ship}}" joined your fleet', {
      type: t(shipType.api_name),
      ship: t(ship.api_name),
    })
  const itemMessage = item && t('Useitem_got', { item: t(item.api_name), count })

  const shipComponent =
    shipMessage &&
    (navyAlbumShowShipAvailable ? (
      <button
        type="button"
        onClick={handleClick}
        key="ship"
        style={{ backgroundColor: 'initial', border: 0, outline: 'none' }}
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

export default DropInfo
