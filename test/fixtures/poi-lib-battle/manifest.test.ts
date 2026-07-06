import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import manifest from './manifest.json'

const repoRoot = process.cwd()

function collectJsonFixtures(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) return collectJsonFixtures(entryPath)
    return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : []
  })
}

describe('poi-lib-battle oracle fixture manifest', () => {
  it('documents pinned upstream source metadata', () => {
    expect(manifest.source.repository).toBe('poooi/lib-battle')
    expect(manifest.source.commit).toMatch(/^[0-9a-f]{40}$/)
  })

  it('mirrors the expected upstream battle-detail fixture corpus', () => {
    const fixtureRoot = path.resolve(repoRoot, manifest.fixtureRoot)
    const fixtures = collectJsonFixtures(fixtureRoot)

    expect(fixtures).toHaveLength(manifest.expectedFixtureCount)

    for (const fixtureSet of manifest.fixtureSets) {
      const fixtureSetRoot = path.resolve(repoRoot, fixtureSet.localPath)
      expect(fs.existsSync(fixtureSetRoot), fixtureSet.localPath).toBe(true)
      expect(collectJsonFixtures(fixtureSetRoot)).toHaveLength(fixtureSet.fixtureCount)
      expect(fixtureSet.upstreamPath).toMatch(/^tests\/fixtures\//)
      expect(fixtureSet.coverage.length).toBeGreaterThan(0)
    }

    for (const fixturePath of fixtures) {
      expect(() => JSON.parse(fs.readFileSync(fixturePath, 'utf8'))).not.toThrow()
    }
  })
})
