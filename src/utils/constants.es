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

// sortieState
// 0: port, switch on when /kcsapi/api_port/port
// 1: before battle, switch on when /kcsapi/api_req_map/start or /kcsapi/api_req_map/next
// 2: battle, switch on with PM emit type
// 3: practice, switch on with PM emit type
export const SortieState = {
  InPort: 0,
  Navigation: 1,
  Battle: 2,
  Practice: 3,
}
