# TypeScript React Refactor Plan

## Decision

The repository already has an in-progress TypeScript migration on `master`. The scope is no longer a full rewrite. The goal is to refactor and harden the existing TypeScript implementation until it is maintainable, testable, and behavior-compatible with the old plugin.

Keep the current plugin contract:

- `reactClass`
- `settingsClass`
- `reducer`
- `pluginDidLoad`
- `pluginWillUnload`
- `switchPluginPath`

## Current baseline

The current TypeScript baseline already includes:

| Area | Current state |
|---|---|
| Entry | `index-src.ts` exports plugin entry points |
| Build | `tsdown.config.ts` builds `index-src.ts` to root `index.js` |
| UI | `src/index.tsx` is already a function component using React hooks |
| Runtime handler | `src/game-handler.ts` owns game response handling and battle simulation orchestration |
| Plugin reducer | `src/redux.ts` owns history, local useitem tracking, and battle display state |
| Battle library | `poi-lib-battle@^3.0.5` is already consumed as a package |
| Battle adapter | `src/utils/lib-battle-adapter.ts` already wraps `poi-lib-battle`; refactor it rather than creating a second adapter |
| Types | `kcsapi` types and local `shims/**` exist, but Poi host types still need verification against `poooi/poi` |
| Components | Existing view stack is TypeScript/TSX but still mirrors the old connected/component structure |

## Non-goals

Do not restart from a blank slate. Do not rebuild the plugin shell, package entry, or battle adapter from scratch unless a parity test proves the existing TypeScript path cannot be fixed safely.

Do not introduce a second internal state system by default. In particular, do not add Jotai unless a later refactor proves Redux/selectors cannot provide enough inspectability for battle state.

## Required tech choices

| Concern | Decision |
|---|---|
| Language | TypeScript with strictness preserved and tightened where possible |
| React style | Function components and hooks only |
| Redux binding | Hooks/selectors only; no new `connect`/`mapStateToProps` |
| Build | Keep `tsdown` |
| Battle library | Keep `poi-lib-battle@3.x`; do not resurrect the old `lib/battle` submodule path |
| State | Keep exported Redux reducer as the single plugin state store for now |
| Component workbench | Add Storybook with React/Vite for visual component states |
| Tests | Vitest for unit/integration/parity; Playwright for host/E2E replay |
| E2E data | Use `poi-lib-battle` upstream oracle data as the primary battle replay source |

## Remaining work decisions

| Item | Decision | Reason |
|---|---|---|
| Full rewrite | Drop | The TypeScript migration already exists; refactoring is lower risk. |
| Jotai | Defer/drop for now | Current battle state is already in Redux and inspectable through selectors. Add Jotai only after an ADR proves concrete maintainability benefit over Redux selectors. |
| Plugin-local `UseItemReducer` | Remove after selector validation | Poi tracks useitem/member-item state. Prefer typed selectors against Poi state and delete plugin-local tracking/cache if parity proves the Poi state is complete enough. |
| `poi-lib-battle` migration | Keep current package path | `poi-lib-battle@3.x` is already in package metadata; focus on adapter parity and oracle tests. |
| Storybook | Keep | Useful for the existing TSX component stack and visual parity during refactor. |
| Playwright E2E | Keep focused | Use oracle replay and minimal fake Poi host; avoid broad/browser-heavy tests without parity value. |
| Host type shims | Refactor | Replace guessed local shapes with types sourced from `poooi/poi` where available. |
| CI modernization | Keep | Current workflow is transitional; final CI must run the full validation stack. |

## Poi type sourcing

The local `shims/**` files must not be treated as authoritative. Before changing host-facing types, inspect and pin a `poooi/poi` commit and derive types from that source.

| Type area | Upstream source |
|---|---|
| globals, config, IPC | `poooi/poi:shims/global.d.ts`, `shims/utils.d.ts`, `shims/vendor/**` |
| `views/*` paths | `poooi/poi:tsconfig.json` |
| store and dispatch | `poooi/poi:views/create-store.ts`, `views/redux/**`, `views/services*.ts` |
| selectors | `poooi/poi:views/utils/**` |
| host UI components | `poooi/poi:views/components/**` |
| theme/assets/env | `poooi/poi:views/env*.ts`, `views/theme.ts`, `views/style.d.ts` |

Rules:

1. Pin the inspected Poi commit in implementation notes.
2. Import or reference upstream exported TypeScript types when feasible.
3. If a local adapter type is still needed, cite the upstream file and symbol or state field it mirrors.
4. Do not infer host Redux, IPC, selector, component, or global types from plugin code alone.

## Refactor architecture target

Keep the existing entry points, but split responsibilities:

```text
src/
  index.tsx                  # React root, hooks, passes view model to UI
  game-handler.ts             # thin event subscription shell only
  selectors.ts                # typed Poi/plugin selectors
  redux.ts                    # plugin-owned persisted state only
  battle/
    packet-controller.ts      # pure battle lifecycle transitions
    battle-view-model.ts      # normalized render model
    damage-notification.ts    # notification eligibility and payload
    lib-battle-adapter.ts     # only production wrapper around poi-lib-battle
  host/
    poi-types.ts              # sourced from poooi/poi
    poi-assets.ts             # plugin/host asset resolvers
    poi-ipc.ts                # NavyAlbum and MainWindow IPC facade
  components/
    battle/
    settings/
  stories/
    battle/
    settings/
```

This layout is a target. Move files incrementally; do not rename existing files just for aesthetics unless the move reduces coupling or enables tests.

## State management policy

Use Redux/selectors first because the current plugin already exposes and persists state through the Poi extension reducer. The refactor should make that state more reflective by splitting it into typed slices and selectors, not by adding a second state library.

Allowed state owners:

| State | Owner |
|---|---|
| persisted formation/history | plugin reducer |
| battle display state | plugin reducer initially; may be extracted to pure reducer/controller |
| source packet log for tests | test harness/controller fixtures |
| derived view model | pure selector/view-model builder |
| component local UI-only state | React hooks in leaf/container components |

Jotai decision:

- Not required for the current refactor.
- Do not add `jotai` to dependencies in the refactor plan.
- Reconsider only if Redux selector/refactor work still leaves battle simulation state opaque, and document the specific atom graph, migration cost, and parity impact first.

## Useitem state policy

The current `src/redux.ts` has a plugin-local `UseItemReducer`. That should not be carried forward unless Poi main state cannot provide the required count.

Required work:

1. Locate Poi's useitem/member-item state in `poooi/poi` and determine whether it is complete/timely enough for Prophet's drop-count UI.
2. Add a typed selector for that state.
3. Update `drop-info.tsx` to read item counts from the Poi selector.
4. Keep legacy `_prophet.useitem` only as a temporary fallback/migration input if needed.
5. Delete plugin-local useitem actions, reducer branches, observer, and cache writes once parity passes.

Acceptance:

- Drop item count matches legacy display.
- No new code updates `_prophet.useitem`.
- Tests cover item drop count before and after removing the plugin-local reducer.

## Component and Storybook policy

Components should be presentational where possible. They may consume view models, typed props, and host UI/asset facades. They must not parse raw game packets or call `window`/`config`/IPC directly.

Storybook is required for refactored components:

1. Use latest stable Storybook React/Vite.
2. Provide stories for settings controls and battle UI states.
3. Use fixed view-model fixtures and fake host facades.
4. Cover light/dark theme, horizontal/vertical layout, MVP, escaped ships, damaged ships, drops, transport points, last formation, air raid, and empty navigation states.
5. `storybook:build` must pass before component refactor work is considered complete.

## Test and parity strategy

Use the current TypeScript implementation as the baseline for plugin behavior, and use `poi-lib-battle` upstream oracle data for battle simulation expectations.

Required layers:

| Layer | Purpose |
|---|---|
| Unit tests | Pure selectors, reducers, packet controller, view-model builders |
| Adapter/oracle tests | Verify plugin adapter output against `poi-lib-battle` oracle packet/result corpus |
| Component tests | React Testing Library for semantic DOM behavior |
| Storybook build | Visual state coverage and component isolation |
| Playwright E2E | Minimal fake Poi host replaying oracle battle packets |
| Package smoke | Built package exports and asset/externalization checks |

Coverage targets:

| Area | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/battle/**` | 100% | 100% | 100% | 100% |
| `src/selectors.ts`, `src/redux.ts`, `src/game-handler.ts` extracted pure logic | 100% | 100% | 100% | 100% |
| `src/host/**` | 100% | 100% | 100% | 100% |
| `src/utils/**` | 100% | 100% | 100% | 100% |
| `src/components/**` | 95% | 90% | 95% | 95% |
| Global | 98% | 95% | 98% | 98% |

Do not lower thresholds to make CI pass. Exclude only type-only declarations, generated files, static fixtures, and test bootstrap files.

## Required fixtures

Prefer `poi-lib-battle` upstream oracle cases for battle packets and results. The oracle corpus must come from a pinned upstream repository/test ref, not from the installed npm package tarball unless that tarball is proven to ship the needed tests/oracles. Add plugin-only fixtures only when the behavior is outside lib-battle's domain.

Required plugin scenarios:

| Scenario | Source |
|---|---|
| normal, air, land-base, night, combined, enemy-combined, night-to-day battles | `poi-lib-battle` oracle corpus |
| map start/next/air raid navigation | plugin fixture |
| land-base destruction object/array/stringified forms | plugin fixture if not in oracle |
| repair item HP correction | oracle if available, otherwise plugin fixture |
| heavily damaged notification | plugin fixture |
| history restore and clear history | plugin fixture |
| useitem drop count from Poi state | plugin fixture |
| settings toggles | component/story fixtures |

## CI and scripts

Current workflow status:

- The workflow is transitional.
- It uses current GitHub Actions, Node 22, and `npm ci --legacy-peer-deps` because the existing legacy peer graph is not npm 10-clean.
- The temporary install flag is intentional until dependency/lockfile refresh. After that refresh, final CI must switch to plain `npm ci`.

Target scripts:

```json
{
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc --noEmit",
    "lint": "eslint \"src/**/*.{ts,tsx}\" \"index-src.ts\" --max-warnings=0",
    "lint:fix": "eslint \"src/**/*.{ts,tsx}\" \"index-src.ts\" --fix",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:parity": "vitest run test/parity",
    "test:e2e": "playwright test",
    "test:package": "npm pack --dry-run && vitest run test/package",
    "storybook": "storybook dev",
    "storybook:build": "storybook build",
    "validate": "npm run typecheck && npm run lint && npm run test:coverage && npm run test:parity && npm run build && npm run storybook:build && npm run test:e2e && npm run test:package"
  }
}
```

Target CI must run:

1. `npm ci` after dependency/lockfile refresh removes the temporary `--legacy-peer-deps` exception
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test:coverage`
5. `npm run test:parity`
6. `npm run build`
7. `npm run storybook:build`
8. `npx playwright install --with-deps` or equivalent Playwright image
9. `npm run test:e2e`
10. `npm run test:package`
11. coverage artifact upload

## Implementation phases

### Phase 0: Baseline audit

1. Record current TypeScript baseline behavior.
2. Pin inspected `poooi/poi` and `poi-lib-battle` refs.
3. Identify all locally invented host types in `shims/**`.
4. Inventory current gaps: tests, package smoke, CI, useitem ownership, battle state coupling.

### Phase 1: Host and type cleanup

1. Replace guessed host types with upstream-derived types where possible.
2. Add typed host facades for assets and IPC.
3. Keep React components away from direct `window`, `config`, and IPC calls.

### Phase 2: Battle/controller extraction

1. Extract pure packet lifecycle logic from `game-handler.ts`.
2. Extract notification eligibility and payload construction.
3. Extract view-model construction from `battle-view-area.tsx` and related selectors.
4. Add unit tests before moving UI behavior.

### Phase 3: Useitem ownership cleanup

1. Consume Poi main useitem state through typed selectors.
2. Update `drop-info.tsx`.
3. Remove plugin-local useitem reducer/cache writes after parity passes.

### Phase 4: Component refactor and Storybook

1. Keep function components.
2. Split large components only when it improves testability.
3. Add stories and component tests for required states.
4. Preserve visual behavior unless a documented parity decision says otherwise.

### Phase 5: Validation hardening

1. Add Vitest, coverage, parity, Playwright, Storybook build, and package smoke scripts.
2. Replace transitional CI with full validation.
3. Remove `npm ci --legacy-peer-deps` after lockfile/dependency refresh.

Coverage thresholds are final hardening gates, not requirements for the first PR that introduces the test runner. Apply them once the corresponding refactored module area exists and before declaring the refactor complete.

## Final acceptance criteria

1. Current TypeScript migration remains buildable through `tsdown`.
2. Plugin public exports remain compatible.
3. Battle behavior is covered by `poi-lib-battle` oracle replay plus plugin-specific parity tests.
4. Host types are sourced from `poooi/poi` or explicitly justified.
5. Plugin-local useitem tracking is removed or formally justified if Poi state cannot replace it.
6. Storybook covers settings and battle component states.
7. Full validation CI is in place and green.
