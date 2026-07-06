# TypeScript + Modern React Rewrite Plan

## Decision

Rewrite the plugin application/UI layer in TypeScript and modern React, while preserving the Poi plugin contract and using the new TypeScript `lib-battle` as the battle-domain core.

This is not a blank-slate product rewrite. The rewrite must keep existing user-visible behavior, persisted data, settings, exported plugin shape, translations, icons, and Poi integration points compatible.

## Non-negotiable goals

1. Preserve the public plugin entry contract:
   - `reactClass`
   - `settingsClass`
   - `reducer`
   - `switchPluginPath`
2. Preserve persisted cache compatibility for localStorage key `_prophet`.
3. Replace the current giant component/event-handler stack with typed, testable modules.
4. Use the new TypeScript `lib-battle`; do not port the current embedded JavaScript simulator by hand.
5. Add automated parity coverage before deleting legacy behavior.
6. Do not introduce untyped host access, global access, battle packet parsing, or `lib-battle` imports outside their approved adapter modules.

## Current pain points to remove

| Current file | Problem | Rewrite target |
|---|---|---|
| `src/index.es` | React class component owns event subscription, battle state, notification logic, adapter logic, layout sizing, Redux selection, and rendering | Split into root component, hooks, domain reducer, packet controller, notification service |
| `src/views/battle-view-area.es` | Connected UI component computes view model and renders layout in one place | Pure typed view model builder + presentational TSX components |
| `src/redux.es` | Untyped actions, implicit cache shape, side-effectful observer setup | Typed reducer, typed storage, explicit observer wiring |
| `src/utils/lib-battle-adapter.es` | Mixed translation, raw host reads, model conversion, result synthesis | Typed `battle` adapter and pure view-model normalization |
| `lib/battle` | Old JavaScript submodule | Replace/upgrade to new TypeScript `lib-battle` and consume through one adapter |

## Fixed target tech stack

Use these choices unless a Poi runtime incompatibility is proven by an automated failing compatibility test.

| Concern | Decision |
|---|---|
| Language | TypeScript with `strict: true` |
| React style | Function components and hooks only |
| Class components | Not allowed in new code |
| Redux binding style | Do not use `connect` or `mapStateToProps` in new code; use typed hooks/selectors at the plugin boundary |
| Decorators | Not allowed |
| PropTypes | Not allowed in new code; TypeScript props replace them |
| Build | `tsdown` for library/plugin entry build |
| Type checking | `tsc --noEmit` |
| Unit/integration tests | `vitest` |
| React tests | `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` |
| Coverage | Vitest V8 coverage provider |
| E2E/parity smoke | `playwright` against a minimal Poi host fixture |
| Lint | ESLint flat config with `@typescript-eslint` strict rules |
| Formatting | Prettier |
| Runtime React dependency | Do not bundle `react` or `react-dom`; continue to consume the Poi host React runtime |
| Styling | Keep `styled-components` initially to preserve styling behavior |
| Localization | Use `react-i18next` hooks directly in React components; do not add a Poi i18n wrapper |
| State | Keep the exported plugin reducer; use local React hooks for component state |
| Host imports | Keep Poi host imports behind typed adapter modules |

## Runtime, build, and package contract

Before implementation starts, prove the Poi runtime compatibility assumptions with a minimal built plugin loaded by a fake Poi host fixture. Record the result in this document or a follow-up design note before replacing source files.

Required compatibility decisions:

| Concern | Required decision |
|---|---|
| Host React version | Verify whether automatic JSX runtime is supported. If not, set `jsx` to `react` and use explicit React imports. |
| Module format | Build CommonJS unless a Poi host fixture proves ESM plugin loading works. |
| Package entry | Source entry is `src/index.ts`; published entry is root `index.js`; `package.json.main` must be updated to `index.js`. |
| Type declarations | Generate root `index.d.ts`; set `package.json.types` to `index.d.ts`. |
| Assets | Publish plugin-owned `assets/**` unchanged. Plugin asset resolution must point to the package root, not `src` or a build subdirectory. Poi-host-owned assets must resolve through a separate host asset resolver. |
| Source maps | Generate source maps for debugging, but do not require Poi to load them. |
| Publish contents | `npm pack --dry-run` must show `index.js`, `index.d.ts`, `assets/**`, `package.json`, `README.md`, and required license files. |
| Build Node version | CI and local validation use Node 22.x unless `tsdown` documents a newer minimum. |
| Runtime JS target | Emit `es2018` unless the compatibility spike proves the minimum supported Poi/Electron runtime requires a lower target. |

Required `tsdown` contract:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs'],
  outDir: '.',
  target: 'es2018',
  fixedExtension: false,
  sourcemap: true,
  clean: false,
  dts: true,
  deps: {
    neverBundle: [
      /^views\//,
      '@blueprintjs/core',
      /^react(\/.*)?$/,
      /^react-dom(\/.*)?$/,
      'react-fontawesome',
      'react-i18next',
      'react-redux',
      'redux',
      'redux-observers',
      'reselect',
      'styled-components',
    ],
  },
})
```

The object entry name `index` is required so the root output is `index.js`. Do not rely on default output naming for the package entry.
`fixedExtension: false` is required so CJS output is `index.js`/`index.d.ts` instead of `index.cjs`/`index.d.cts`. The compatibility and package smoke tests must assert exact emitted filenames.
If a non-host runtime package from `node_modules` must be bundled, add it deliberately to `deps.alwaysBundle`.
Document why it cannot remain external, and update the package smoke test to assert the bundled dependency is expected.

`lib-battle` decision: upgrade the current stale `lib/battle` submodule to the upstream TypeScript rewrite before Phase 2. Target upstream tag `v3.0.5` unless a newer tagged release is explicitly chosen and recorded. Keep `lib-battle` vendored in this repository as a pinned git submodule or checked-in source package and import it by relative path from `src/battle/lib-battle-adapter.ts`. Do not rely on Poi to provide `lib-battle` at runtime. Package smoke must fail if the built output contains an external `require('lib-battle')`, `require('poi-lib-battle')`, or equivalent unresolved `lib-battle` package import.

Required `lib-battle` upgrade procedure:

1. Fetch upstream tags for `lib/battle`.
2. Re-pin the submodule to upstream tag `v3.0.5` or an explicitly recorded newer tag.
3. Read upstream `MIGRATION.md` before writing the adapter.
4. Inventory upstream fixture/oracle/test corpus and copy or reference the reusable cases under `test/fixtures/lib-battle-upstream`.
5. Map this plugin's required fixture matrix to upstream fixtures first; synthesize local fixtures only for plugin-specific Poi integration, storage, notification, settings, and view-model behavior not covered upstream.
6. Add an upgrade note recording old submodule ref, new tag/ref, migration notes used, fixture corpus location, and any upstream behavior changes accepted for this plugin.

Package migration requirements:

1. Delete the legacy root `index.es` before final package acceptance.
2. Remove the legacy `prepack: poi-util-transpile --sm --replace` flow.
3. Remove `postpublish: npm run reset`.
4. Prefer removing `prepack`. If a `prepack` script remains, it must run only a non-recursive subset such as `npm run build` or `npm run prepack:validate`; it must not call `npm run validate`, `npm run test:package`, or `npm pack`.
5. Package smoke must fail if packed files include root `index.es`, `src/**/*.es`, legacy transpiler output, or `poi-util-transpile` lifecycle usage.

Do not add runtime dependencies for packages proven to be provided by Poi. If a package is not provided by Poi and is required at runtime, add it to `dependencies` explicitly and include it in the package smoke test. Prefer native TypeScript helpers over adding lodash to the new implementation.

Default TypeScript compiler posture if the compatibility spike confirms automatic JSX runtime support. If the host requires classic React JSX, keep every option below except set `"jsx": "react"`.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
  }
}
```

Forbidden in new TypeScript source:

- `any`
- `@ts-ignore`
- untyped `window` access
- untyped `config` access
- direct `localStorage` access outside `src/state/storage.ts`
- direct `lib-battle` imports outside `src/battle/lib-battle-adapter.ts`
- raw `game.response` parsing inside React components
- direct `i18next` or `react-i18next` usage outside React components
- lodash `get` for new internal data structures

## Target source layout

```text
src/
  index.ts
  plugin/
    prophet-root.tsx
    settings-root.tsx
    plugin-exports.ts
  host/
    poi-globals.ts
    poi-redux.ts
    poi-ui.tsx
    poi-assets.ts
    poi-types.ts
  battle/
    lib-battle-adapter.ts
    packet-types.ts
    packet-controller.ts
    battle-view-model.ts
    damage-notification.ts
  state/
    actions.ts
    plugin-reducer.ts
    selectors.ts
    storage.ts
    observers.ts
  components/
    battle/
      battle-panel.tsx
      fleet-column.tsx
      ship-card.tsx
      ship-tooltip.tsx
      hp-bar.tsx
      battle-summary.tsx
      drop-info.tsx
      next-spot-info.tsx
      land-base-squad.tsx
    settings/
      settings-panel.tsx
      checkbox-setting.tsx
      radio-setting.tsx
  utils/
    layout.ts
    spot.ts
    transport.ts
    paths.ts
  types/
    plugin.ts
    kancolle-api.ts
    view-models.ts
```

Only `src/index.ts` may expose the final plugin exports. It must not contain business logic.

## Approved dependency directions

```text
components -> React + styling + child components + host UI facade + view-models/types only
plugin -> host + state + battle + components
battle -> host types + lib-battle-adapter + packet types
state -> host types + storage
host -> typed facades over globals, Poi modules, and host UI modules only
utils -> pure helpers only
```

Rules:

1. `components/**` must not import `lib-battle`, `window`, `config`, Redux store objects, or raw battle packets.
2. `components/**` may import `host/poi-ui.tsx` for typed wrappers around Poi tooltips, avatars, icons, material icons, slot item icons, and game color helpers.
3. `battle/**` must not import React.
4. `state/**` must not import React.
5. `host/**` must not import plugin components.
6. `lib-battle-adapter.ts` is the only production module allowed to import the new TypeScript `lib-battle`; `legacy-lib-battle-adapter.ts` may import the old JavaScript implementation only for test parity and must be deleted in Phase 8.

## View model boundary

The rewrite must render from explicit view models, not raw Poi/Kancolle packets.

Minimum required view models:

```ts
export interface ProphetViewModel {
  layout: 'horizontal' | 'vertical'
  sortieState: SortieState
  allied: FleetGroupViewModel
  enemy: FleetGroupViewModel
  summary: BattleSummaryViewModel
  map: NextSpotViewModel | null
  drop: DropViewModel | null
}

export interface FleetGroupViewModel {
  title: string
  main: FleetViewModel | null
  escort: FleetViewModel | null
  airForce: AirForceViewModel | null
  transport: TransportPointViewModel | null
}

export interface ShipViewModel {
  key: string
  id: number
  owner: 'ours' | 'enemy' | 'friend' | 'landBase'
  name: string
  level: number | null
  position: number
  hp: HpViewModel
  damage: number
  isMvp: boolean
  isEscaped: boolean
  useItemId: number | null
  params: ShipParameterViewModel | null
  slots: SlotItemViewModel[]
  avatar: AvatarViewModel | null
}

export interface DropViewModel {
  ship: DropShipViewModel | null
  item: DropItemViewModel | null
  canOpenNavyAlbum: boolean
}

export interface DropItemViewModel {
  id: number
  name: string
  count: number
}
```

The renderer must be replaceable without changing battle parsing. The battle parser must be testable without React.

## Implementation phases

### Phase 0: Safety baseline

Deliverables:

1. Run the runtime/build compatibility spike described above.
2. Record the exact new TypeScript `lib-battle` package, version, commit, or submodule ref. Do not start Phase 2 until this is pinned in package metadata.
3. Add the test runner, type checker, and coverage scripts.
4. Add a minimal typed host fixture for tests.
5. Add a legacy parity harness before deleting legacy code.
6. Capture or synthesize deterministic game response fixtures.
7. Add a temporary compatibility build fixture:
   - `test/fixtures/host-smoke/compat-entry.ts`
   - `test/fixtures/host-smoke/tsdown.compat.config.ts`
   - `npm run build:compat`
8. Add a legacy-to-TypeScript interop build fixture:
   - `test/fixtures/legacy-interop/legacy-adapter-entry.ts`
   - `test/fixtures/legacy-interop/tsdown.legacy-interop.config.ts`
   - `npm run build:legacy-interop`

`build:compat` must use the same `tsdown` output format, target, externals, JSX mode, asset-path assumptions, and fake Poi host loading path as the final package build, but it must not require final `src/index.ts` to exist. The final package `npm run build` gate starts in Phase 7 when `src/index.ts` exists.

`build:legacy-interop` must compile the TypeScript adapter entry to CommonJS that legacy Babel/stage-0 `.es` code can load before Phase 7 exists. It must use the same `lib-battle` pin, target, CJS mode, and host externals as the final build, but output only the adapter bridge needed by legacy production/parity code.

Legacy parity harness options:

1. Preferred: run legacy `.es` modules through the same Babel/stage-0 transform assumptions used by the current project, with fake Poi globals and side effects disabled.
2. Fallback: generate checked-in golden outputs from the current implementation before replacement and compare the TypeScript implementation against those outputs.

The selected option must be implemented in `test/parity` before any legacy behavior is deleted. If the fallback is used, each golden fixture must include metadata explaining the scenario and expected outputs.

Required fixtures:

| Fixture | Required path sequence |
|---|---|
| game refresh reset | `/kcsapi/api_start2/getData` |
| in-port fleet | `/kcsapi/api_port/port` |
| map start | `/kcsapi/api_req_map/start` |
| map next | `/kcsapi/api_req_map/next` |
| start air base ignored event | map start then `/kcsapi/api_req_map/start_air_base` then battle packet |
| practice enemy info | `/kcsapi/api_req_member/get_practice_enemyinfo` |
| normal day battle | `/kcsapi/api_req_sortie/battle` then `/kcsapi/api_req_sortie/battleresult` |
| normal night battle | day battle then `/kcsapi/api_req_battle_midnight/battle` then result |
| combined battle | `/kcsapi/api_req_combined_battle/battle` then result |
| practice battle | `/kcsapi/api_req_practice/battle` then `/kcsapi/api_req_practice/battle_result` |
| land-base air raid | `/kcsapi/api_req_map/air_raid` with `api_destruction_battle` |
| drop result | battle result with `api_get_ship` and `api_get_useitem` |
| heavy damage notification | result where non-escaped own ship HP is `<= 25%` |
| repair item correction | first battle packet flagship HP mismatch resulting in `useItemId` 42 and 43 cases |
| escaped ship | combined fleet with `sortie.escapedPos` |
| history restore | `_prophet.history` preloaded |
| use item cache update | `api_get_member/require_info`, `useitem`, remodel, mission result, battle result |
| land-base destruction shape | `api_destruction_battle` as object and as array |
| land-base serialized air attack | stringified `api_air_base_attack` |
| land-base no stage3 | destruction battle without `api_stage3` |

Required battle packet path matrix:

| Family | Paths requiring fixture coverage |
|---|---|
| normal day | `/kcsapi/api_req_sortie/battle`, `/kcsapi/api_req_sortie/airbattle`, `/kcsapi/api_req_sortie/ld_airbattle`, `/kcsapi/api_req_sortie/ld_shooting` |
| normal night | `/kcsapi/api_req_battle_midnight/battle`, `/kcsapi/api_req_battle_midnight/sp_midnight` |
| practice | `/kcsapi/api_req_practice/battle`, `/kcsapi/api_req_practice/midnight_battle`, `/kcsapi/api_req_practice/battle_result` |
| combined day | `/kcsapi/api_req_combined_battle/battle`, `/kcsapi/api_req_combined_battle/battle_water`, `/kcsapi/api_req_combined_battle/airbattle`, `/kcsapi/api_req_combined_battle/ld_airbattle`, `/kcsapi/api_req_combined_battle/ld_shooting` |
| combined each/enemy-combined | `/kcsapi/api_req_combined_battle/ec_battle`, `/kcsapi/api_req_combined_battle/each_battle`, `/kcsapi/api_req_combined_battle/each_battle_water` |
| combined night | `/kcsapi/api_req_combined_battle/midnight_battle`, `/kcsapi/api_req_combined_battle/sp_midnight`, `/kcsapi/api_req_combined_battle/ec_midnight_battle` |
| night-to-day | `/kcsapi/api_req_combined_battle/ec_night_to_day` |
| result | `/kcsapi/api_req_sortie/battleresult`, `/kcsapi/api_req_combined_battle/battleresult`, `/kcsapi/api_req_practice/battle_result` |

The packet controller must append every known `lib-battle`-supported battle packet while a battle is active. A new battle path may be added only with a packet-controller test, a fixture or fixture-family justification, and a parity decision.

Every sortie battle fixture must start from an active battle state. Either prepend `/kcsapi/api_req_map/start`, `/kcsapi/api_req_map/next`, or `/kcsapi/api_req_map/air_raid` to the packet sequence, or explicitly initialize the controller with an active battle fixture state that is itself covered by parity tests.

Fixture rules:

1. Remove or synthesize account, player, device, and local-machine identifiers.
2. Keep packet order deterministic.
3. Store expected normalized outputs next to fixtures.
4. Side effects must be captured as data: dispatched actions, notifications, storage writes, and IPC calls.

Acceptance gate:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:coverage`
- `npm run build:compat`
- `npm run build:legacy-interop`

During Phase 0, `npm run test:coverage` is scoped to the newly added test harness, host fixture, compatibility build fixture, and parity snapshot tooling. Final global thresholds begin only after the corresponding TypeScript source areas exist, and all final thresholds are mandatory by Phase 8.

No rewrite code may replace legacy rendering before this phase passes.

### Phase 1: Type the host boundary

Create:

- `src/host/poi-globals.ts`
- `src/host/poi-redux.ts`
- `src/host/poi-ui.tsx`
- `src/host/poi-assets.ts`
- `src/host/poi-types.ts`

Responsibilities:

1. Wrap `window.getStore`, `window.notify`, `window.ResizeObserver`, `window.isDarkTheme`, `window.isSafeMode`, `window.APPDATA_PATH`, `window.ROOT`, `window.ipc`, debug hooks, and host diagnostics.
2. Wrap global `config.get` and `config.set`.
3. Declare typed selectors for required Poi Redux state:
   - `state.sortie`
   - `state.info.airbase`
   - `state.info.fleets`
   - `state.const.$ships`
   - `state.const.$equips`
   - `state.const.$useitems`
   - `state.const.$shipTypes`
   - `state.const.$maps`
   - `state.config.plugin.prophet`
   - `state.fcd.map`
   - `state.ipc.NavyAlbum.showShip`
4. Keep existing host import strings such as `views/utils/selectors` in one place.
5. Wrap host UI integrations in `poi-ui.tsx`:
   - `Tooltip`
   - `Avatar`
   - `MaterialIcon`
   - `SlotitemIcon`
   - `getCondStyle`
   - `getHpStyle`
6. Wrap NavyAlbum IPC calls behind an injected function:
   - `showShipInNavyAlbum(shipId: number): void`
   - focus `poi-plugin-navy-album` if `MainWindow.ipcFocusPlugin` is available.
7. Provide two explicit asset resolvers in `poi-assets.ts`:
   - `resolvePluginAssetPath(...parts)` for this package's `assets/**`
   - `resolvePoiHostAssetPath(...parts)` for Poi host assets under `window.ROOT`, including damaged notification icon and aircraft proficiency images.

Acceptance gate:

- No new source file outside `host/**` may access `window` or `config`.
- Host wrappers have unit tests using fake globals.
- No component imports `views/*` directly; components import `host/poi-ui.tsx`.

### Phase 2: Upgrade `lib-battle`

Replace the current `lib/battle` JavaScript submodule usage with the pinned new TypeScript `lib-battle`.

Rules:

1. Do not change UI behavior in this phase.
2. Create the legacy-to-TypeScript bridge before changing production imports:
   - `src/battle/lib-battle-adapter.ts` contains the strict TypeScript adapter.
   - `test/fixtures/legacy-interop/legacy-adapter-entry.ts` re-exports the CJS-compatible adapter surface.
   - `npm run build:legacy-interop` emits a generated CommonJS bridge consumed by legacy `.es` code during Phase 2.
   - A temporary legacy `.es` facade may `require` only that generated bridge; it must not import TypeScript directly.
3. First rewire production source so legacy rendering reaches battle behavior only through the generated bridge and adapter boundary; do this before replacing or deleting the old submodule path.
4. Keep the old JavaScript `lib/battle` available for tests until adapter parity is accepted.
5. Create `src/battle/legacy-lib-battle-adapter.ts` for test-only parity if the Babel legacy harness is used.
6. Create `src/battle/lib-battle-adapter.ts` for the new TypeScript `lib-battle`.
7. If any temporary old import path compatibility is needed, implement it as an explicit facade that delegates to the generated bridge and delete it in Phase 8.
8. Convert old adapter responsibilities into typed functions:
   - own fleet conversion
   - enemy fleet conversion
   - battle simulation
   - result synthesis
   - air force status extraction
   - formation/engagement/air-control normalization to translation keys or display tokens
9. All production `lib-battle` imports must be in `lib-battle-adapter.ts`.

Acceptance gate:

- Existing legacy UI still renders through the adapter.
- `npm run build:legacy-interop` runs before any legacy `.es` production/parity code imports the TypeScript adapter.
- Legacy `.es` code loads the generated CommonJS bridge in tests and runtime; it never imports `.ts` files directly.
- Parity tests compare old adapter or golden output to new adapter output for every battle fixture.
- Every mismatch is classified as `bug-compatible required`, `accepted lib-battle behavior change`, or `new regression`.
- Accepted behavior changes are recorded in the incompatibility decision log with a regression test for the new expected behavior.
- No production `lib-battle` imports outside `src/battle/lib-battle-adapter.ts`; test-only old implementation imports are limited to `src/battle/legacy-lib-battle-adapter.ts`.

### Phase 3: Extract packet controller

Replace the event-handling block currently inside `src/index.es` with a pure controller.

Create:

- `src/battle/packet-controller.ts`
- `src/battle/damage-notification.ts`

`packet-controller.ts` owns:

1. Current battle lifecycle.
2. Transition on map start/next/air raid.
3. Transition on practice battle.
4. Transition on day/night/combined result.
5. Fleet refresh from host Redux state.
6. Dispatching history/practice actions through an injected dispatcher.

`damage-notification.ts` owns:

1. Heavily damaged ship detection.
2. Escaped ship exclusion.
3. Practice exclusion.
4. Notification payload construction, including `plugin.prophet.notify.damagedAudio`.

Acceptance gate:

- Packet controller tests cover every fixture sequence.
- Notification tests cover enabled, disabled, custom audio, practice, escaped, and threshold boundary cases.
- React components contain no raw packet switch statements.

### Phase 4: Rewrite state and storage

Create:

- `src/state/actions.ts`
- `src/state/plugin-reducer.ts`
- `src/state/storage.ts`
- `src/state/observers.ts`
- `src/state/selectors.ts`

Compatibility requirements:

1. `_prophet.history` format remains readable.
2. `_prophet.useitem` format remains readable.
3. Existing action types remain accepted:
   - `@@poi-plugin-prophet@updateHistory`
   - `@@poi-plugin-prophet@updatePractice`
   - `@@poi-plugin-prophet@loadHistory`
   - `@@poi-plugin-prophet@clearHistory`
   - current Kancolle response action types used by `UseItemReducer`
4. The exported `reducer` keeps the same state shape:

```ts
{
  history: Record<string, HistoryEntry>
  useitem: Record<string, UseItemEntry>
}
```
5. Malformed `_prophet` JSON must produce a host diagnostic, initialize an empty in-memory cache, and avoid overwriting storage until a valid state update occurs. This intentional improvement must be covered by tests and recorded in the incompatibility decision log.

Acceptance gate:

- Reducer parity tests cover every current action branch.
- Storage tests cover safe mode, empty storage, malformed storage, save debounce trigger, and cache update.
- No direct `localStorage` access outside `storage.ts`.

### Phase 5: Rewrite settings UI

Create:

- `src/plugin/settings-root.tsx`
- `src/components/settings/settings-panel.tsx`
- `src/components/settings/checkbox-setting.tsx`
- `src/components/settings/radio-setting.tsx`

Preserve settings:

| Key | Type | Default |
|---|---|---|
| `plugin.prophet.showScale` | boolean | `true` |
| `plugin.prophet.ecGameOrder` | boolean | `true` |
| `plugin.prophet.showEnemyTitle` | boolean | `true` |
| `plugin.prophet.showLastFormation` | boolean | `true` |
| `plugin.prophet.useFinalParam` | boolean | `true` |
| `plugin.prophet.notify.enable` | boolean | `true` |
| `plugin.prophet.notify.damagedAudio` | string or undefined | `undefined`; consumed by notifications only, no settings UI |
| `plugin.prophet.showAvatar` | boolean | `false` |
| `plugin.prophet.showAirRaid` | boolean | `true` |
| `plugin.prophet.layout` | `'auto' | 'horizontal' | 'vertical'` | `'auto'` |

Acceptance gate:

- Component tests verify each setting renders, reads default, writes via host config adapter, and updates checked state.
- Clear-history button dispatches `@@poi-plugin-prophet@clearHistory`, updates cache, and shows success state.
- `plugin.prophet.notify.damagedAudio` is excluded from rendered setting assertions unless a separate accepted behavior change defines a new UI for it.

### Phase 6: Rewrite battle UI

Create the TSX components under `src/components/battle`.

Rendering rules:

1. Components consume only view models.
2. Layout decision happens in `utils/layout.ts`.
   - `layout: 'horizontal'` and `layout: 'vertical'` are explicit.
   - `layout: 'auto'` resolves to horizontal when `height < 300` or `height * 5 < width * 3`; otherwise it resolves to vertical.
3. Tooltip placement is isolated in a hook:
   - `useFleetMeasurement(rootRef, containerRef)`
4. Translation happens at the React component edge with `react-i18next` hooks.
   - View models carry translation keys, resource IDs, or domain display tokens.
   - Non-React modules must not import `i18next` or `react-i18next`.
5. SVG/icon paths are resolved through `host/poi-assets.ts`.

Required component tests:

| Component | Required assertions |
|---|---|
| `battle-panel.tsx` | horizontal layout, vertical layout, empty enemy while navigating, battle info placement |
| `fleet-column.tsx` | main fleet, escort fleet, hidden empty fleet, compact mode |
| `ship-card.tsx` | normal damage, MVP, escaped, avatar enabled, avatar disabled |
| `hp-bar.tsx` | current HP, lost HP, stage HP, repair item, scale enabled/disabled, condition class |
| `ship-tooltip.tsx` | friendly ship, enemy ship ID, fuel/ammo, params, normal slots, extra slot |
| `battle-summary.tsx` | rank icon, formation, engagement, air control, smoke |
| `drop-info.tsx` | ship drop, item drop with cached count, no drop, NavyAlbum button availability, NavyAlbum click IPC |
| `next-spot-info.tsx` | compass angle, spot icon, resources, last formation, smoke hint, heavy bomber defense |
| `land-base-squad.tsx` | base damage and HP rendering |

Additional required UI assertions:

1. Transport point display renders total and actual values.
2. Transport point A-rank tooltip renders `Math.floor(actual * 0.7)`.
3. Transport points hide outside event maps.
4. Transport point calculation excludes escaped ships and uses current heavy-damage behavior.
5. Slot item icons render host `SlotitemIcon`, improvement level, aircraft proficiency image, and extra-slot label.
6. `showEnemyTitle: false` hides stored enemy deck names and uses the generic enemy title.
7. `ecGameOrder: false` flips enemy combined fleet order to the non-game-order layout.
8. `showAirRaid: false` suppresses land-base air raid rendering while preserving navigation state.
9. `useFinalParam: false` makes ship tooltips render base parameters instead of final parameters.
10. `showLastFormation: false` hides both the last formation hint and smoke hint.
11. `layout: 'auto'` covers `height < 300`, `height * 5 < width * 3`, and vertical fallback cases.

Acceptance gate:

- Visual output snapshots or DOM assertions exist for every required UI state.
- Components do not import Redux, raw packets, host globals, or `lib-battle`.

### Phase 7: Replace plugin root

Create:

- `src/plugin/prophet-root.tsx`
- `src/plugin/plugin-exports.ts`
- `src/index.ts`

Active fleet selection contract:

1. If `sortie.sortieStatus` contains any truthy fleet flags, select those fleet indices in order.
2. Otherwise, if `sortie.combinedFlag` is truthy, select fleet `0` and fleet `1`.
3. Otherwise, if `info.fleets.2.api_ship` contains seven positive ship IDs, select fleet `2`.
4. Otherwise, select fleet `0`.
5. For each selected fleet, pad selected ship data with `undefined` and slice to the fleet slot count before converting to battle models.

`prophet-root.tsx` owns:

1. Reading typed host state through hooks/selectors and passing selected data to the packet controller.
2. Subscribing and unsubscribing from `game.response`.
3. Observing root size.
4. Passing `ProphetViewModel` to the `battle-panel.tsx` component.

It must not own:

- class lifecycle methods
- `connect` or `mapStateToProps`
- raw battle simulation
- raw packet parsing
- notification eligibility rules
- localStorage writes
- settings mutation

Acceptance gate:

- Integration test mounts `ProphetRoot` from `prophet-root.tsx` with fake Poi host state and dispatches `game.response` events.
- Export test verifies `reactClass`, `settingsClass`, `reducer`, and `switchPluginPath`.
- Active fleet selection tests cover sortieStatus, combinedFlag, seven-ship fleet 2, fallback fleet 0, and empty-slot padding.
- Static checks or lint tests fail if new source uses React class components, decorators, `connect`, or `mapStateToProps`.
- Legacy root is deleted only after parity tests pass.

### Phase 8: Remove legacy code

Delete or replace:

- `src/index.es`
- `src/redux.es`
- `src/views/**/*.es`
- old `src/utils/lib-battle-adapter.es`
- old JavaScript `lib/battle` integration path

Keep assets and translations unless tests prove they are unused.

Acceptance gate:

- No `.es` source remains under `src`.
- No legacy class component remains.
- No PropTypes dependency remains if no other source uses it.
- Package scripts and CI run only the new toolchain.

## Parity validation strategy

Parity is validated at four layers.

Old and new implementations may run side by side only in tests or development harnesses with side effects disabled. In real plugin runtime, do not process the same `game.response` through both implementations unless notifications, dispatches, storage writes, and IPC calls are mocked.

Every parity mismatch must be triaged into exactly one category:

| Category | Meaning | Required action |
|---|---|---|
| `bug-compatible required` | Existing behavior is required for compatibility even if it looks wrong | Match legacy and add a test documenting why |
| `accepted lib-battle behavior change` | New TypeScript `lib-battle` intentionally fixes or changes domain output | Record in the incompatibility decision log and test the new expected output |
| `new regression` | New implementation diverges without an approved reason | Fix before continuing |

## Incompatibility decision log

Record every accepted behavior difference here before merging the phase that introduces it.

| ID | Scenario | Legacy behavior | New behavior | Reason | Test |
|---|---|---|---|---|---|
| TBD | Malformed `_prophet` JSON | Plugin may fail during JSON parse | Host diagnostic + empty in-memory cache until next valid update | Quality improvement | `storage.test.ts` malformed cache case |

### 1. State parity

Input:

- fake initial Poi Redux state
- fake `_prophet` cache
- ordered fixture packets

Output:

- plugin reducer state
- packet controller state
- normalized `ProphetViewModel`
- emitted notifications
- dispatched actions
- storage writes

Comparison:

- Normalize dynamic fields.
- Compare exact JSON snapshots.
- Fail on missing fields, extra fields, changed rank, changed HP, changed formation, changed fleet order, changed title, changed drop, changed notification payload, or changed cache shape.
- Capture side effects as serializable records instead of executing host notifications, storage writes, dispatches, or IPC.

### 2. UI parity

Input:

- fixed `ProphetViewModel` fixtures

Output:

- DOM rendered by new TSX components

Comparison:

- Prefer semantic DOM assertions.
- Use snapshots only for stable, small subtrees.
- Avoid snapshots for generated styled-components class names.

### 3. Host contract parity

Input:

- minimal fake Poi host fixture

Output:

- plugin can be imported
- exported names exist
- `reactClass` can mount
- `settingsClass` can mount
- reducer can be registered
- `switchPluginPath` is unchanged

Comparison:

- Exact export keys.
- Exact `switchPluginPath` array:

```ts
[
  '/kcsapi/api_req_map/start',
  '/kcsapi/api_req_practice/battle',
  '/kcsapi/api_req_map/next',
  '/kcsapi/api_req_map/air_raid',
]
```

### 4. Package smoke parity

Input:

- output of `npm pack --dry-run`
- built root package entry
- minimal fake Poi host fixture

Output:

- package includes required runtime files and assets
- `require('./index.js')` returns the plugin exports
- asset paths resolve to files under package root
- host asset paths resolve through the fake Poi host root, not the plugin package root
- externalized Poi modules are not bundled into the package entry
- `react`, `react-dom`, and React subpath imports such as `react/jsx-runtime` are external and not bundled

Comparison:

- Exact export keys.
- Required assets exist.
- Host-owned assets are not packed as plugin assets.
- No bundled copies of React or host Poi modules appear in the built output.
- If automatic JSX runtime is enabled, the fake Poi host must provide `react/jsx-runtime`; otherwise TypeScript must use classic React JSX.
- No external unresolved `lib-battle` package import remains in the built output.

## Test and quality scripts

Add these scripts:

```json
{
  "scripts": {
    "build": "tsdown",
    "build:compat": "tsdown --config test/fixtures/host-smoke/tsdown.compat.config.ts",
    "build:legacy-interop": "tsdown --config test/fixtures/legacy-interop/tsdown.legacy-interop.config.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:parity": "vitest run test/parity",
    "test:e2e": "playwright test",
    "test:package": "npm pack --dry-run && vitest run test/package",
    "validate": "npm run typecheck && npm run lint && npm run test:coverage && npm run test:parity && npm run build && npm run test:e2e && npm run test:package"
  }
}
```

Coverage gates:

| Area | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/battle/**` | 100% | 100% | 100% | 100% |
| `src/state/**` | 100% | 100% | 100% | 100% |
| `src/host/**` | 100% | 100% | 100% | 100% |
| `src/utils/**` | 100% | 100% | 100% | 100% |
| `src/components/**` | 95% | 90% | 95% | 95% |
| Global | 98% | 95% | 98% | 98% |

Any uncovered line in `battle`, `state`, `host`, or `utils` must be either removed or tested. Do not lower thresholds to make CI pass. Exclude only type-only declarations, generated declaration files, static fixture data, and test harness bootstrap files; do not add meaningless no-op tests to satisfy coverage.

## CI requirements

Replace the current Node 14 lint-only workflow with a Node LTS validation workflow.

Required CI jobs:

1. Use Node 22.x unless `tsdown` documents a newer minimum.
2. Install dependencies with `npm ci`.
3. Install Playwright browsers and system dependencies with `npx playwright install --with-deps`, or run inside an official Playwright image that already includes them.
4. Run `npm run typecheck`.
5. Run `npm run lint`.
6. Run `npm run test:coverage`.
7. Run `npm run test:parity`.
8. Run `npm run build`.
9. Run `npm run test:e2e`.
10. Run `npm run test:package`.
11. Upload coverage artifacts.

The workflow must fail on:

- TypeScript errors.
- ESLint warnings.
- Coverage below threshold.
- Snapshot mismatch.
- Parity mismatch.
- Build failure.
- Package smoke failure.

## Coding-agent rules

Agents implementing this plan must follow these rules exactly:

1. Do not convert files mechanically from `.es` to `.tsx` without splitting responsibilities first.
2. Do not add new behavior during parity phases.
3. Do not delete legacy code until the equivalent new module has parity tests.
4. Do not access host globals directly outside `src/host/**`.
5. Do not import production `lib-battle` outside `src/battle/lib-battle-adapter.ts`; test-only old implementation imports are limited to `src/battle/legacy-lib-battle-adapter.ts` and must be removed in Phase 8.
6. Do not put raw packet parsing in React components.
7. Do not add `any`, `@ts-ignore`, broad catch blocks, or silent fallbacks.
8. Do not change `_prophet` storage shape without a migration test.
9. Do not change `switchPluginPath` without a host contract test.
10. Do not lower coverage thresholds.
11. Do not replace SVG assets or translations as part of the rewrite.
12. Do not add runtime dependencies that duplicate Poi host-provided React modules.
13. Do not run old and new runtime logic side by side with real notifications, dispatches, storage writes, or IPC enabled.
14. Do not change package entry, output format, or externalization rules without updating package smoke tests.
15. Do not accept a parity mismatch without adding it to the incompatibility decision log.

## Final acceptance criteria

The rewrite is complete only when all of the following are true:

1. `src` is TypeScript/TSX.
2. The plugin exports are unchanged.
3. The new TypeScript `lib-battle` is used through one typed adapter.
4. No giant root component owns battle parsing, state mutation, host events, and rendering together.
5. All required fixture scenarios pass parity validation.
6. All quality scripts pass through `npm run validate`.
7. CI runs typecheck, lint, coverage, parity, E2E smoke, build, and package smoke.
8. Existing localStorage data under `_prophet` remains readable.
9. Settings keep the same keys and defaults.
10. The old JavaScript component stack is removed.
11. `npm run validate` and package smoke tests pass on CI.
