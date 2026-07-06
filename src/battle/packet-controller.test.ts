import fs from 'node:fs'
import path from 'node:path'
import { Battle, type BattleOptions } from 'poi-lib-battle'
import { beforeEach, describe, expect, it } from 'vitest'

import fixture from '../../test/fixtures/poi-lib-battle/battle-detail/features/air_base_attack/1615132578245.json'
import manifest from '../../test/fixtures/poi-lib-battle/manifest.json'
import { SortieState } from '../utils/constants'
import { simulateBattleDisplayState } from './packet-controller'

const repoRoot = process.cwd()

function collectJsonFixtures(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) return collectJsonFixtures(entryPath)
    return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : []
  })
}

describe('simulateBattleDisplayState', () => {
  beforeEach(() => {
    window.getStore = <T,>(_path?: string, defaultValue?: T): T => defaultValue as T
  })

  it('replays the curated lib-battle air-base oracle fixture into stable Prophet display state', () => {
    const battle = new Battle(fixture as unknown as BattleOptions)
    const state = simulateBattleDisplayState(battle)

    expect(state.sortieState).toBe(SortieState.Battle)
    expect(state.result?.rank).toBe('S')
    expect(state.result?.mvp).toEqual([0, -1])
    expect(state.battleForm).toBe('Parallel Engagement')
    expect(state.eFormation).toBe('Line Ahead')
    expect(state.fFormation).toBe('Line Ahead')
    expect(state.airControl).toBe('Air Superiority')
    expect(state.airForce).toEqual([6, 1, 12, 12])
    expect(state.mainFleet?.map((ship) => ship?.nowHP)).toEqual([93, 8, 1, 22, 9, 2])
    expect(state.enemyFleet?.map((ship) => ship?.nowHP)).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('replays the full curated lib-battle battle-detail oracle corpus without packet-controller regressions', () => {
    const fixtureRoot = path.resolve(repoRoot, manifest.fixtureRoot)
    const fixturePaths = collectJsonFixtures(fixtureRoot)

    expect(fixturePaths).toHaveLength(manifest.expectedFixtureCount)

    for (const fixturePath of fixturePaths) {
      const fixtureName = path.relative(repoRoot, fixturePath)
      const battle = new Battle(JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as BattleOptions)
      const state = simulateBattleDisplayState(battle)

      expect(state.sortieState, fixtureName).toBeDefined()
      expect(state.fFormation, fixtureName).toBeDefined()
      expect(state.eFormation, fixtureName).toBeDefined()
      expect(state.battleForm, fixtureName).toBeDefined()
      expect(state.mainFleet?.length, fixtureName).toBeGreaterThan(0)
      expect(state.enemyFleet?.length, fixtureName).toBeGreaterThan(0)
    }
  })
})
