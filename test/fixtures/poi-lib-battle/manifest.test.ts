import { describe, expect, it } from 'vitest'

import { readBattleDetailCorpus } from './corpus'
import manifest from './manifest.json'

describe('poi-lib-battle oracle fixture manifest', () => {
  it('documents pinned upstream source metadata', () => {
    expect(manifest.source.repository).toBe('poooi/lib-battle')
    expect(manifest.source.commit).toMatch(/^[0-9a-f]{40}$/)
  })

  it('mirrors the expected upstream battle-detail fixture corpus', () => {
    const corpus = readBattleDetailCorpus()
    const upstreamPaths = new Set(corpus.fixtures.map((fixture) => fixture.upstreamPath))

    expect(corpus.source.repository).toBe(manifest.source.repository)
    expect(corpus.source.commit).toBe(manifest.source.commit)
    expect(corpus.source.upstreamRoot).toBe(manifest.upstreamRoot)
    expect(corpus.fixtures).toHaveLength(manifest.expectedFixtureCount)
    expect(upstreamPaths).toHaveLength(corpus.fixtures.length)

    for (const fixtureSet of manifest.fixtureSets) {
      expect(fixtureSet.upstreamPath).toMatch(/^tests\/fixtures\//)
      expect(fixtureSet.coverage.length).toBeGreaterThan(0)
      expect(
        corpus.fixtures.filter((fixture) => fixture.upstreamPath.startsWith(`${fixtureSet.upstreamPath}/`)),
      ).toHaveLength(fixtureSet.fixtureCount)
    }

    for (const fixture of corpus.fixtures) {
      expect(fixture.upstreamPath).toMatch(/^tests\/fixtures\/battle-detail\/.+\.json$/)
      expect(fixture.data).toBeTypeOf('object')
    }
  })
})
