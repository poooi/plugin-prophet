export const PLUGIN_KEY = 'poi-plugin-prophet'

export const combinedFleetType: Record<number, string> = {
  0: 'Sortie Fleet',
  1: 'Carrier Task Force',
  2: 'Surface Task Force',
  3: 'Transport Escort',
}

export const lostKind: Record<number, string> = {
  1: 'Resources sustained losses',
  2: 'Resources and land-based air squadrons sustained losses',
  3: 'Land-based air squadrons sustained losses',
  4: 'No damage was inflicted',
}

export const SortieState = {
  InPort: 0,
  Navigation: 1,
  Battle: 2,
  Practice: 3,
} as const

export type SortieStateValue = (typeof SortieState)[keyof typeof SortieState]
