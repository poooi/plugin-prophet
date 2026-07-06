import fs from 'node:fs'
import path from 'node:path'

import manifest from './manifest.json'

export interface BattleDetailCorpusEntry {
  upstreamPath: string
  data: unknown
}

interface BattleDetailCorpus {
  source: {
    repository: string
    commit: string
    upstreamRoot: string
  }
  fixtures: BattleDetailCorpusEntry[]
}

export const readBattleDetailCorpus = (): BattleDetailCorpus =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), manifest.corpusPath), 'utf8')) as BattleDetailCorpus

export const findBattleDetailFixture = (upstreamPath: string): unknown => {
  const fixture = readBattleDetailCorpus().fixtures.find((entry) => entry.upstreamPath === upstreamPath)
  if (fixture == null) throw new Error(`Missing battle-detail oracle fixture: ${upstreamPath}`)
  return fixture.data
}
