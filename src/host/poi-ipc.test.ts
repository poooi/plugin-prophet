import { afterEach, describe, expect, it, vi } from 'vitest'

import { canShowShipInNavyAlbum, showShipInNavyAlbum } from './poi-ipc'

describe('poi ipc facade', () => {
  afterEach(() => {
    delete window.ipc
    vi.restoreAllMocks()
  })

  it('reads NavyAlbum availability from Poi state', () => {
    expect(canShowShipInNavyAlbum({ ipc: { NavyAlbum: { showShip: true } } } as PoiRootState)).toBe(true)
    expect(canShowShipInNavyAlbum({ ipc: { NavyAlbum: { showShip: false } } } as PoiRootState)).toBe(false)
    expect(canShowShipInNavyAlbum({} as PoiRootState)).toBe(false)
  })

  it('opens NavyAlbum and focuses the plugin when IPC is available', () => {
    const showShip = vi.fn()
    const ipcFocusPlugin = vi.fn()

    window.ipc = {
      access: (name: string): Record<string, (...args: unknown[]) => unknown> => {
        if (name === 'NavyAlbum') return { showShip }
        if (name === 'MainWindow') return { ipcFocusPlugin }
        return {}
      },
    }

    showShipInNavyAlbum(123)

    expect(showShip).toHaveBeenCalledWith(123)
    expect(ipcFocusPlugin).toHaveBeenCalledWith('poi-plugin-navy-album')
  })

  it('does nothing when IPC is unavailable', () => {
    expect(() => showShipInNavyAlbum(123)).not.toThrow()
  })

  it('shows the ship without throwing when MainWindow IPC is unavailable', () => {
    const showShip = vi.fn()

    window.ipc = {
      access: (name: string): Record<string, (...args: unknown[]) => unknown> | undefined =>
        name === 'NavyAlbum' ? { showShip } : undefined,
    }

    expect(() => showShipInNavyAlbum(123)).not.toThrow()
    expect(showShip).toHaveBeenCalledWith(123)
  })

  it('does not throw when an advertised NavyAlbum scope becomes unavailable', () => {
    window.ipc = {
      access: (): undefined => undefined,
    }

    expect(() => showShipInNavyAlbum(123)).not.toThrow()
  })
})
