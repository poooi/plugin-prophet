import path from 'path'

const { APPDATA_PATH } = window

export const PLUGIN_KEY = 'poi-plugin-prophet'
export const HISTORY_PATH = path.join(APPDATA_PATH, 'prophet-history.json')

export const combinedFleetType = {
  0: 'Sortie Fleet',
  1: 'Carrier Task Force', // 空母機動部隊
  2: 'Surface Task Force', // 水上打撃部隊
  3: 'Transport Escort', // 輸送護衛部隊
}

export const lostKind = {
  1: 'Resources sustained losses',
  2: 'Resources and land-based air squadrons sustained losses',
  3: 'Land-based air squadrons sustained losses',
  4: 'No damage was inflicted',
}
