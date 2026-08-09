import { Fleet, Models, Simulator, type Ship } from 'poi-lib-battle'
import { beforeEach, describe, expect, it } from 'vitest'

import { initEnemy } from './lib-battle-adapter'

const { Ship: ShipClass, ShipOwner } = Models

const ourShip = (pos: number, nowHP: number, maxHP = 30): Ship =>
  new ShipClass({ id: 100 + pos, owner: ShipOwner.Ours, pos, maxHP, nowHP, items: [] })

// The game may hide an enemy's HP behind a placeholder; such an enemy can never be
// sunk, so it must take no part in the rank calculation.
const enemyHP = (...nowhps: (number | string)[]): number[] => nowhps as number[]

const rankAgainst = (nowhps: (number | string)[], ourDamage = 0): string | undefined => {
  const simulator = new Simulator(new Fleet({}))
  const flagship = ourShip(0, 30)
  flagship.nowHP = 30 - ourDamage
  simulator.mainFleet = [flagship]
  simulator.enemyFleet = initEnemy(
    0,
    nowhps.map((_hp, i) => 500 + i),
    nowhps.map(() => []),
    enemyHP(...nowhps.map((hp) => (typeof hp === 'number' ? 30 : hp))),
    enemyHP(...nowhps),
    nowhps.map(() => 1),
  )
  return simulator.result.rank
}

describe('initEnemy', () => {
  beforeEach(() => {
    window.getStore = <T,>(_path?: string, defaultValue?: T): T => defaultValue as T
  })

  it('flags enemies whose HP the game does not report as a number', () => {
    const fleet = initEnemy(0, [500, 501], [[], []], enemyHP(30, 'N/A'), enemyHP(0, 'N/A'), [1, 1])

    expect(fleet.map((ship) => ship?.hpUnknown)).toEqual([false, true])
  })

  it('reaches S once every enemy with a known HP is sunk', () => {
    expect(rankAgainst([0, 'N/A'])).toBe('SS')
    expect(rankAgainst([0, 'N/A'], 10)).toBe('S')
  })

  it('falls short of S while an enemy with a known HP survives', () => {
    expect(rankAgainst([20, 'N/A'])).toBe('D')
  })

  it('claims no victory when no enemy HP is known at all', () => {
    expect(rankAgainst(['N/A', 'N/A'])).toBe('D')
  })
})
