

const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

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