/**
 * Typed wrapper for Poi i18n.
 * Only this file may import from views/env-parts/i18next.
 */
import i18next from 'views/env-parts/i18next'

export function getFixedT(ns: string | string[]): (key: string, opts?: Record<string, unknown>) => string {
  return i18next.getFixedT(null, ns) as (key: string, opts?: Record<string, unknown>) => string
}

export { i18next }
