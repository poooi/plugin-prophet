"use strict"



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
