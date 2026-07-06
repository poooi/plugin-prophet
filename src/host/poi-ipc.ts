type NavyAlbumIPC = {
  showShip?: (shipId: number) => unknown
}

type MainWindowIPC = {
  ipcFocusPlugin?: (pluginId: string) => unknown
}

export const canShowShipInNavyAlbum = (state: PoiRootState): boolean =>
  state.ipc?.NavyAlbum?.showShip ?? false

export const showShipInNavyAlbum = (shipId: number): void => {
  const { ipc } = window
  if (!ipc) return

  const navyAlbum = ipc.access('NavyAlbum') as NavyAlbumIPC
  navyAlbum.showShip?.(shipId)

  const mainWindow = ipc.access('MainWindow') as MainWindowIPC
  mainWindow.ipcFocusPlugin?.('poi-plugin-navy-album')
}
