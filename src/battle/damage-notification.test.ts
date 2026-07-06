import { describe, expect, it, vi } from 'vitest'
import type { Ship } from 'poi-lib-battle'

import { SortieState } from '../utils/constants'
import { getHeavilyDamagedShipNames } from './damage-notification'

const ship = (overrides: Partial<Ship>): Ship =>
  ({
    maxHP: 100,
    nowHP: 100,
    pos: 1,
    raw: { api_ship_id: 1 },
    ...overrides,
  }) as Ship

describe('getHeavilyDamagedShipNames', () => {
  it('returns translated names for non-escaped heavily damaged ships', () => {
    const getShipName = vi.fn((id: number | undefined) => `ship-${id}`)
    const translate = vi.fn((text: string) => `t:${text}`)

    expect(
      getHeavilyDamagedShipNames({
        mainFleet: [ship({ nowHP: 25 })],
        escortFleet: [ship({ nowHP: 24, pos: 7, raw: { api_ship_id: 2 } })],
        sortieState: SortieState.Battle,
        getShipName,
        translate,
      }),
    ).toEqual(['t:ship-1', 't:ship-2'])
  })

  it('ignores safe, escaped, null, and practice ships', () => {
    const input = {
      mainFleet: [
        ship({ nowHP: 26, pos: 1 }),
        ship({ nowHP: 25, pos: 2 }),
        null,
      ],
      escapedPos: [1],
      getShipName: (id: number | undefined) => `ship-${id}`,
      translate: (text: string) => text,
    }

    expect(getHeavilyDamagedShipNames({ ...input, sortieState: SortieState.Battle })).toEqual([])
    expect(getHeavilyDamagedShipNames({ ...input, sortieState: SortieState.Practice })).toEqual([])
  })

  it('does not classify ships with invalid max HP as heavily damaged', () => {
    expect(
      getHeavilyDamagedShipNames({
        mainFleet: [ship({ maxHP: 0, nowHP: 0 })],
        sortieState: SortieState.Battle,
        getShipName: (id) => `ship-${id}`,
        translate: (text) => text,
      }),
    ).toEqual([])
  })
})
