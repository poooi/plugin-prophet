import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import manifest from './manifest.json'

const repoRoot = path.resolve(__dirname, '../../..')

describe('poi-lib-battle oracle fixture manifest', () => {
  it('documents pinned upstream source metadata', () => {
    expect(manifest.source.repository).toBe('poooi/lib-battle')
    expect(manifest.source.commit).toMatch(/^[0-9a-f]{40}$/)
  })

  it('points to valid local JSON fixtures', () => {
    expect(manifest.fixtures.length).toBeGreaterThan(0)

    for (const fixture of manifest.fixtures) {
      const fixturePath = path.resolve(repoRoot, fixture.localPath)
      expect(fs.existsSync(fixturePath), fixture.localPath).toBe(true)
      expect(() => JSON.parse(fs.readFileSync(fixturePath, 'utf8'))).not.toThrow()
      expect(fixture.upstreamPath).toMatch(/^tests\/fixtures\//)
      expect(fixture.coverage.length).toBeGreaterThan(0)
    }
  })
})
