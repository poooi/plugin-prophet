
import { Models } from 'lib/battle'
import { getShipName, getItemName } from 'utils'
const { __ } = window
const { ShipOwner } = Models

// formation
const FormationName = {
  1: __('Line Ahead'),
  2: __('Double Line'),
  3: __('Diamond'),
  4: __('Echelon'),
  5: __('Line Abreast'),
  11: __('Cruising Formation 1 (anti-sub)'),
  12: __('Cruising Formation 2 (forward)'),
  13: __('Cruising Formation 3 (ring)'),
  14: __('Cruising Formation 4 (battle)'),
}

// intercept
const EngagementName = {
  1: __('Parallel Engagement'),
  2: __('Head-on Engagement'),
  3: __('Crossing the T (Advantage)'),
  4: __('Crossing the T (Disadvantage)'),
}

// dispSeiku
const AirControlName = {
  0: __('Air Parity'),
  1: __('Air Supremacy'),   // AS+
  2: __('Air Superiority'), // AS
  3: __('Air Incapability'),
  4: __('Air Denial'),
}

// spotInfo
const SpotTypeName = {
  1: __('Start'),
  2: __('Unknown'),
  3: __('Obtain Resources'),
  4: __('Lose Resources'),
  5: __('Battle'),
  6: __('Boss Battle'),
  7: __('Battle Avoid'),
  8: __('Air Strike'),
  9: __('Escort Success'),
  10: __('Transport Munitions'),
  11: __('Manual Selection'),
  12: __('Aerial Recon'),
}

// dropCount
const HalfSinkNumber = [
  0, 1, 1, 2, 2, 3, 4,
]

const InitPlaneCount = {
  seiku: -1,
  sortie: [0, 0],
  enemy: [0, 0],
}

class Ship {
  // s=lib-battle/models/Ship
  constructor(s, damage, dayDamage) {
    const r = {...s.raw}
    this.hp = {
      now: s.nowHP,
      max: s.maxHP,
      init: s.initHP,
      lost: s.lostHP,
      damage: damage,  // Damage from this to other ships.
      dayDamage: dayDamage,
    }
    this.id = s.id
    this.lv = r.api_lv
    this.cond = r.api_cond
    this.name = getShipName(r)
    this.slot = []  // TODO
    this.owner = s.owner === ShipOwner.Ours ? 0 : 1
    this.back = 0  // HELP: What's this?
  }
}

class Fleet {
  constructor() {
    this.ship = []
    this.mvp = 0
  }
}

class Result {
  constructor() {
    this.ruined = this.count = 0
    this.injure = this.totalHp = 0.0
    this.rate = 0.0
  }
}
