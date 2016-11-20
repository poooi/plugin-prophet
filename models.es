import {range} from 'lodash'

export class Ship{
  constructor () {
    this.hp = {
      now: 0,
      max: 0,
      injure: 0,
      damage: 0,
      dayInjure: 0,
    }
    this.id = -1
    this.lv = -1
    this.cond = 0
    this.name = "Null"
    this.slot = []
    // owner: 0 ours 1 enemy
    this.owner = 1
    this.back = 0
  }
}

// why not use ships?
export class Fleet{
  constructor () {
    this.ship = []
    for (let i in range(0,6))
      this.ship.push(new Ship())
    this.mvp = 0
  }
}


export class Result{
  constructor () {
    this.ruined = this.count = 0
    this.injure = this.totalHp = 0.0
    this.rate = 0.0
  }
}