import React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import { useTranslation } from 'react-i18next'
import type { PoiRootState } from '../../host/poi-types'

const { ipc } = window as unknown as { ipc: { access: (name: string) => Record<string, (...args: unknown[]) => void> } }

interface DropInfoOwnProps {
  shipId: number | null
  itemId: number | null
}

interface DropInfoStateProps {
  ship: { api_id: number; api_name: string; api_stype: number } | undefined
  item: { api_id: number; api_name: string } | undefined
  shipType: { api_name: string } | undefined
  navyAlbumShowShipAvailable: boolean
  count: number
}

const DropInfoInner: React.FC<DropInfoOwnProps & DropInfoStateProps> = ({
  ship,
  item,
  shipType,
  navyAlbumShowShipAvailable,
  count,
}) => {
  const { t } = useTranslation(['poi-plugin-prophet', 'resources'])

  const handleClick = () => {
    if (!ship) return
    const navyAlbum = ipc.access('NavyAlbum')
    if (navyAlbum.showShip) {
      navyAlbum.showShip(ship.api_id)
    }
    const mainWindow = ipc.access('MainWindow')
    if (mainWindow.ipcFocusPlugin) {
      mainWindow.ipcFocusPlugin('poi-plugin-navy-album')
    }
  }

  const shipMessage =
    ship && shipType
      ? t('{{type}} "{{ship}}" joined your fleet', {
          type: t(shipType.api_name),
          ship: t(ship.api_name),
        })
      : null

  const itemMessage = item ? t('Useitem_got', { item: t(item.api_name), count }) : null

  const components: React.ReactNode[] = []
  if (shipMessage) {
    components.push(
      navyAlbumShowShipAvailable ? (
        <button
          key="ship"
          type="button"
          onClick={handleClick}
          style={{ backgroundColor: 'initial', border: 0, outline: 'none' }}
        >
          {shipMessage}
        </button>
      ) : (
        <span key="ship">{shipMessage}</span>
      ),
    )
  }
  if (itemMessage) {
    components.push(<span key="item">{itemMessage}</span>)
  }

  return (
    <span className="drop-info">
      {components.flatMap((c, i) =>
        i + 1 === components.length ? [c] : [c, <span key={`sep-${i}`}> | </span>],
      )}
    </span>
  )
}

export const DropInfo = connect(
  (state: PoiRootState, props: DropInfoOwnProps): DropInfoStateProps => {
    const ship = props.shipId != null
      ? (get(state, `const.$ships.${props.shipId}`) as DropInfoStateProps['ship'])
      : undefined
    const item = props.itemId != null
      ? (get(state, `const.$useitems.${props.itemId}`) as DropInfoStateProps['item'])
      : undefined
    const shipType = ship
      ? (get(state, `const.$shipTypes.${ship.api_stype}`) as DropInfoStateProps['shipType'])
      : undefined
    const count = props.itemId != null
      ? (get(state, `ext.poi-plugin-prophet._.useitem.${props.itemId}.api_count`, 0) as number)
      : 0
    const navyAlbumShowShipAvailable = get(state, 'ipc.NavyAlbum.showShip', false) as boolean

    return { ship, item, shipType, navyAlbumShowShipAvailable, count }
  },
)(DropInfoInner)
