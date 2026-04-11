/**
 * Pre-compiles lib/battle .es files to .js for tsdown bundling.
 *
 * lib/battle uses Babel Stage-1 `export X from 'Y'` syntax that modern
 * bundlers (rolldown/esbuild) cannot parse. This script copies each .es
 * file to a .js file, replacing the non-standard syntax with standard ES6:
 *   export Simulator from './simulator'
 *     → export { default as Simulator } from './simulator'
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const battleDir = resolve(__dirname, '../lib/battle')

// Regex: `export Name from 'module'` → `export { default as Name } from 'module'`
const exportDefaultFromRe = /^export\s+(\w+)\s+from\s+(['"].*?['"])/gm

const esFiles = readdirSync(battleDir).filter((f) => f.endsWith('.es') && !f.startsWith('.'))

for (const file of esFiles) {
  const src = readFileSync(join(battleDir, file), 'utf8')
  const fixed = src.replace(exportDefaultFromRe, "export { default as $1 } from $2")
  const dest = join(battleDir, file.replace(/\.es$/, '.js'))
  writeFileSync(dest, fixed)
  console.log(`  prebuild-battle: ${file} → ${file.replace(/\.es$/, '.js')}`)
}
