

const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

export function getShipName(ship) {
  if (ship == null) {
    return null
  }
  let name = ship.api_name
  let yomi = ship.api_yomi
  if (['elite', 'flagship'].includes(yomi)) {
    name += yomi
  }
  return name
}

export function getItemName(item) {
  if (item == null) {
    return null
  }
  let name = item.api_name
  return name
}

export async function sleep(ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms > 0 ? ms : 0)
  })
}

// Formation name map from api_search[0-1] to name
// 1=成功, 2=成功(未帰還機あり), 3=未帰還, 4=失敗, 5=成功(艦載機使用せず), 6=失敗(艦載機使用せず)
const DetectionNameMap = {
  '1': __('Detection Success'),
  '2': __('Detection Success') + ' (' + __('not return') + ')',
  '3': __('Detection Failure') + ' (' + __('not return') + ')',
  '4': __('Detection Failure'),
  '5': __('Detection Success') + ' (' + __('without plane') + ')',
  '6': __('Detection Failure') + ' (' + __('without plane') + ')',
}

// Formation name map from api_formation[0-1] to name
// 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
export const FormationNameMap = {
  '1': __('Line Ahead'),
  '2': __('Double Line'),
  '3': __('Diamond'),
  '4': __('Echelon'),
  '5': __('Line Abreast'),
  '11': __('Cruising Formation 1 (anti-sub)'),
  '12': __('Cruising Formation 2 (forward)'),
  '13': __('Cruising Formation 3 (ring)'),
  '14': __('Cruising Formation 4 (battle)'),
}

// Engagement name map from api_formation[2] to name
// 1=同航戦, 2=反航戦, 3=T字戦有利, 4=T字戦不利
const EngagementNameMap = {
  '1': __('Parallel Engagement'),
  '2': __('Head-on Engagement'),
  '3': __('Crossing the T (Advantage)'),
  '4': __('Crossing the T (Disadvantage)'),
}

// Air Control name map from api_kouku.api_stage1.api_disp_seiku to name
// 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
export const AirControlNameMap = {
  '0': __('Air Parity'),
  '1': __('Air Supremacy'),
  '2': __('Air Superiority'),
  '3': __('Air Incapability'),
  '4': __('Air Denial'),
}

export const AttackType = {
  Normal: "Normal",             // 通常攻撃
  Laser : "Laser",              // レーザー攻撃
  Double: "Double",             // 連撃
  Primary_Secondary_CI: "PSCI", // カットイン(主砲/副砲)
  Primary_Radar_CI    : "PRCI", // カットイン(主砲/電探)
  Primary_AP_CI       : "PACI", // カットイン(主砲/徹甲)
  Primary_Primary_CI  : "PrCI", // カットイン(主砲/主砲)
  Primary_Torpedo_CI  : "PTCI", // カットイン(主砲/魚雷)
  Torpedo_Torpedo_CI  : "TTCI", // カットイン(魚雷/魚雷)
}


export const getAttackTypeName = (type) => {
  switch (type) {
  case AttackType.Normal:
    return __("AT.Normal")
  case AttackType.Double:
    return __("AT.Double")
  case AttackType.Primary_Secondary_CI:
    return __("AT.Primary_Secondary_CI")
  case AttackType.Primary_Radar_CI:
    return __("AT.Primary_Radar_CI")
  case AttackType.Primary_AP_CI:
    return __("AT.Primary_AP_CI")
  case AttackType.Primary_Primary_CI:
    return __("AT.Primary_Primary_CI")
  case AttackType.Primary_Torpedo_CI:
    return __("AT.Primary_Torpedo_CI")
  case AttackType.Torpedo_Torpedo_CI:
    return __("AT.Torpedo_Torpedo_CI")
  default:
    return type + "?"
  }
}