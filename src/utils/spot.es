export const spotInfo = {
  0: '',
  1: 'Start',
  2: 'Battle Avoid',
  3: 'Obtain Resources',
  4: 'Lose Resources',
  5: 'Battle',
  6: 'Boss Battle',
  7: 'Battle Avoid',
  8: 'Air Strike',
  9: 'Escort Success',
  10: 'Transport Munitions',
  11: 'Long Distance Aerial Battle', // 長距離空襲戦
  12: 'Manual Selection',
  13: 'Aerial Recon',
  14: 'Night Battle',
  15: 'Enemy Combined Fleet',
  16: 'Anchorage Repair',
}

export const spotIcon = {
  Battle: '4-1',
  'Night Battle': '4-1',
  'Boss Battle': 5,
  'Obtain Resources': 2,
  'Battle Avoid': '4-2',
  'Long Distance Aerial Battle': 10,
  'Lose Resources': 3,
  'Manual Selection': '4-2',
  'Air Strike': 7,
  'Transport Munitions': 9,
  'Escort Success': 8,
  'Enemy Combined Fleet': '4-1',
  'Anchorage Repair': '4-2',
}

// give spot kind according to api_event_id and api_event_kind
// update according to https://github.com/andanteyk/ElectronicObserver/blob/1052a7b177a62a5838b23387ff35283618f688dd/ElectronicObserver/Other/Information/apilist.txt
export const getSpotKind = (api_event_id, api_event_kind) => {
  // console.log(`api_event_id = ${api_event_id}, api_event_kind = ${api_event_kind}`)
  if (api_event_id === 4) {
    // 4=通常戦闘
    if (api_event_kind === 2) return 14 // 2=夜戦
    if (api_event_kind === 4) return 8 // 4=航空戦
    if (api_event_kind === 5) return 15 // 5=敵連合艦隊戦
    if (api_event_kind === 6) return 11 // 6=長距離空襲戦
  }
  if (api_event_id === 6) {
    // 6=気のせいだった
    if (api_event_kind === 1) {
      // 1="敵影を見ず。"
      return 7
    }
    if (api_event_kind === 2) {
      // 2=能動分岐
      return 12
    }
  } else if (api_event_id === 7) {
    // 7=航空戦or航空偵察
    if (api_event_kind === 0) {
      // 4=航空戦
      return 13
    }
  } else if (api_event_id === 10 && api_event_kind === 0) {
    return 16 // 泊地修理
  }
  return api_event_id + 1
}

// text extracted from SallyMain.swf scripts/scene/sally/phase/cellevents/MereFancyEventPhase
const spotMessage = {
  0: '気のせいだった。',
  1: '敵影を見ず。',
  3: '穏やかな海です。',
  4: '穏やかな海峡です。',
  5: '警戒が必要です。',
  6: '静かな海です。',
  7: '艦隊は対潜警戒進撃中。引き続き、対潜対空警戒を厳とせよ。',
  8: '敵哨戒機らしき機影認む。空襲の恐れあり。対空警戒を厳とせよ!',
  9: '1YB第一第二部隊栗田艦隊はパラワン水道を進撃中。現海域に敵影なし。警戒を厳とせよ!',
  10: '1YB第三部隊、西村艦隊は堂々と進撃中。遊撃部隊主力栗田艦隊を援護せよ! 進め!',
  11: '1YB第三部隊西村艦隊はこれよりスリガオ海峡方面に突入。主力栗田艦隊を援護する! 進め!',
  12: '艦隊はシブヤン海に突入する。対空見張り、厳とせよ！',
  13: '前線航空基地への航空資材輸送作戦は失敗せり。',
  14: '1YB第一第二部隊栗田艦隊はシブヤン海を進撃中。敵艦載機空襲が予測される。対空警戒を厳とせよ!',
  15: '1YB第一第二部隊栗田艦隊はサマール沖を進撃中。敵機動部隊を発見! 全艦突撃せよ!',
  16: '1YB第三部隊西村艦隊はスリガオ海峡に突入せり。栗田艦隊を援護する! 天祐を確認し、全艦突撃せよ!',
  17: 'KdMB機動部隊本隊小沢艦隊は敵機動部隊主力を北方に誘引、好機を捉えこれを捕捉撃破せよ！',
  18: '艦隊左舷にパナイ島を見ゆ……。対空警戒を厳とせよ！',
  19: '艦隊右舷にミンダナオ島を認む。入港準備…――始めッ！',
  20: '2YB遊撃第二部隊志摩艦隊、出撃！敵残存艦隊を索敵捕捉、掃射せよ！',
  21: '2YB遊撃第二部隊、敵哨戒機を発見す！敵機空襲が予測される。対空警戒、厳とせよ!',
  22: '2YB遊撃第二部隊、戦場海域に突入す！対空、そして対潜警戒も厳とせよ！',
  23: '1YB遊撃第一部隊より高速艦艇を抽出。敵残存艦隊の捜索撃滅に出撃す！',
  24: '連合艦隊機動部隊本隊、出撃！敵機動部隊を撃滅する！続け！',
  25: '艦隊、増速！これより連合艦隊は艦隊決戦を行う！　我に続け！',
}

export const getSpotMessage = (api_event_id, api_event_kind) => {
  if ([1, 6].includes(api_event_id)) {
    return spotMessage[api_event_kind] || ''
  }
  return ''
}
