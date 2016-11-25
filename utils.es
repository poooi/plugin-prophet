"use strict"

const {__r} = window
import _ from 'lodash'
import {Ship, ShipOwner} from './lib/battle/models'

export function getShipName(ship) {
  if (ship == null) {
    return null
  }
  let name = __r(ship.api_name)
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
  let name = __r(item.api_name)
  return name
}

export async function sleep(ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms > 0 ? ms : 0)
  })
}

export const initEnemy = (intl=0, api_ship_ke, api_eSlot, api_maxhps, api_nowhps, api_ship_lv) => {
  if (!(api_ship_ke != null)) return
  let fleet = []
  for (const i of _.range(1, 7)) {
    let id    = api_ship_ke[i]
    let slots = api_eSlot[i - 1] || []
    let ship, raw
    if (Number.isInteger(id) && id > 0) {
      raw = {
        api_ship_id: id,
        api_lv: api_ship_lv[i],
        poi_slot: slots.map(id => window.$slotitems[id]),
      }
      ship = new Ship({
        id   : id,
        owner: ShipOwner.Enemy,
        pos  : intl + i,
        maxHP: api_maxhps[i + 6],
        nowHP: api_nowhps[i + 6],
        items: [],  // We dont care
        raw  : raw,
      })
    }
    fleet.push(ship)
  }
  return fleet
}

export const spotInfo = {
  '0': '',
  '1': 'Start',
  '2': 'Unknown',
  '3': 'Obtain Resources',
  '4': 'Lose Resources',
  '5': 'Battle',
  '6': 'Boss Battle',
  '7': 'Battle Avoid',
  '8': 'Air Strike',
  '9': 'Escort Success',
  '10': 'Transport Munitions',
  '11': 'Long Distance Aerial Battle', //長距離空襲戦
  '12': 'Manual Selection',
  '13': 'Aerial Recon',
  '14': 'Night Battle',
  '15': 'Enemy Combined Fleet',
}


// give spot kind according to api_event_id and api_event_kind
// update according to https://github.com/andanteyk/ElectronicObserver/blob/1052a7b177a62a5838b23387ff35283618f688dd/ElectronicObserver/Other/Information/apilist.txt
export const getSpotKind = (api_event_id, api_event_kind) => {
  if (api_event_id == 4){ //4=通常戦闘
    if (api_event_kind == 2) return 14 //2=夜戦
    if (api_event_kind == 4) return 9 //4=航空戦
    if (api_event_kind == 5) return 15 //5=敵連合艦隊戦
    if (api_event_kind == 6) return 11 //6=長距離空襲戦
  }
  if (api_event_id === 6) { //6=気のせいだった
    if (api_event_kind === 1) { //1="敵影を見ず。"
      return 7
    } else if (api_event_kind === 2) { // 2=能動分岐
      return 12
    }
  } else if (api_event_id === 7) { //7=航空戦or航空偵察
    if (api_event_kind === 0) { //4=航空戦
      return 13
    }
  }
  return api_event_id + 1
}

export const lostKind = {
  '1': 'Your resources have sustained losses due to the air-raid!',
  '2': 'Your resources, as well as your land-based air fleets, have sustained losses due to the air-raid!',
  '3': 'Your land-based air fleets have sustained losses due to the air-raid!',
  '4': 'The air-raid has inflicted no damage to the land base.',
}
