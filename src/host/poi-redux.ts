/**
 * Typed wrapper for Poi Redux store access.
 * Only this file may import from views/create-store.
 */
import { store } from 'views/create-store'
import { observe } from 'redux-observers'

export { store }
export { observe }

export function getPoiStore() {
  return store
}
