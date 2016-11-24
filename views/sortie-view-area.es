import React, {Component} from 'react'

import { Grid, Row, Col} from 'react-bootstrap'
import _ from 'lodash'
import { connect } from 'react-redux'

import FleetView from './fleet-view'
import BattleInfo from './battle-info'
import NextSpotInfo from './next-spot-info'
import SquadView from './squad-view'


const { i18n } = window
const __ = i18n["poi-plugin-prophet"].__.bind(i18n["poi-plugin-prophet"])

class Ship {
  constructor(opts) {
    this.id    = opts.id    // int, $ships
    this.owner = opts.owner // ShipOwner
    this.pos   = opts.pos   // int, Position in fleet

    this.maxHP   = opts.maxHP
    this.nowHP   = opts.nowHP
    this.initHP  = opts.nowHP
    this.lostHP  = opts.lostHP || 0
    this.damage  = opts.damage || 0  // Damage from this to others
    this.items   = opts.items
    this.useItem = opts.useItem || null

    this.raw = opts.raw
  }
}

const ShipOwner = {
  Ours : "Ours",
  Enemy: "Enemy",
}


  // deckId in [1, 2, 3, 4]
const getFleet = (deckId) => {
  let deck = window._decks[deckId - 1] || {}
  let ships = deck.api_ship
  if (ships) {
    let fleet = []
    for (let id of ships) {
      fleet.push(getShip(id))
    }
    return fleet
  } else {
    return null
  }
}

const getShip = (shipId) => {
  let ship = Object.clone(window._ships[shipId] || null)
  if (ship) {
    ship.poi_slot = []
    for (let id of ship.api_slot) {
      ship.poi_slot.push(getItem(id))
    }
    ship.poi_slot_ex = getItem(ship.api_slot_ex)
    // Clean up
    delete ship.api_getmes
    delete ship.api_slot
    delete ship.api_slot_ex
    delete ship.api_yomi
  }
  return ship
}

const getItem = (itemId) => {
  let item = Object.clone(window._slotitems[itemId] || null)
  if (item) {
    // Clean up
    delete item.api_info
  }
  return item
}

const initFleet = (rawFleet, intl=0) => {
  if (!(rawFleet != null)) return
  let fleet = []
  for (let [i, rawShip] of rawFleet.entries()) {
    if (rawShip != null) {
      let slots = rawShip.poi_slot.concat(rawShip.poi_slot_ex)
      fleet.push(new Ship({
        id   : rawShip.api_ship_id,
        owner: ShipOwner.Ours,
        pos  : intl + i + 1,
        maxHP: rawShip.api_maxhp,
        nowHP: rawShip.api_nowhp,
        damage: -1,
        items: slots.map(slot => slot != null ? slot.api_slotitem_id : null),
        raw  : rawShip,
      }))
    } else {
      fleet.push(null)
    }
  }
  return fleet
}


const SortieViewArea = connect(
  (state, props) => ({
    layout: _.get(state, 'config.poi.layout', 'horizontal'),
    sortie: state.sortie || {},
  })
)(class SortieViewArea extends Component {
  constructor() {
    super()

  }

  static defaultProps = {
    simulator: {},
  }

  render() {
    const {simulator, layout, sortie} = this.props
    const times = layout == 'horizontal' ? 1 : 2
    let fleetCount = 1 && _.sumBy([simulator.mainFleet, simulator.escortFleet], (fleet) => fleet != null)
    let enemyCount = 1 && _.sumBy([simulator.enemyFleet, simulator.enemyEscort], (fleet) => fleet != null)
    const {api_stage1, result, api_formation} = simulator
    let {api_f_count, api_f_lostcount, api_e_count, api_e_lostcount} = _.pick(api_stage1, ['api_f_count', 'api_f_lostcount', 'api_e_count', 'api_e_lostcount'])

    // hacky way to display fleet status using store
    let sortieCount = 1 && _.sumBy(sortie.sortieStatus, status => status)
    return (
      <div id="overview-area">
        {
          simulator.isAirRaid ? 
            <Grid>
              <Row className="friend-title title">
                <Col xs={12}>
                  {__('Land Base') + (api_f_count ? ` [${api_f_count - api_f_lostcount}/${api_f_count}]`: '')}
                </Col>
              </Row>
              <Row>
                <FleetView fleet={simulator.mainFleet} title={__('Main Fleet')} count={times * fleetCount} View={SquadView}/>
              <Row className="enemy-title title">
                <Col xs={12}>
                  {__('Enemy Vessel') + (api_e_count ? ` [${api_e_count - api_e_lostcount}/${api_e_count}]`: '')}
                </Col>
              </Row>
                <FleetView fleet={simulator.enemyFleet} title={__('Enemy Fleet')} count={times * enemyCount}/>
              </Row>
              <BattleInfo 
                  result = {result && result.rank }
                  formation ={api_formation && api_formation[1]}
                  intercept = {api_formation && api_formation[2]}
                  seiku = {api_stage1 && api_stage1.api_disp_seiku}
              />
              <NextSpotInfo spotKind={this.props.spotKind}/>
            </Grid>
           : 
           <Grid>
                <Row className="friend-title title">
                    <Col xs={12/times}>
                      {__('Sortie Fleet')}
                    </Col>
                  </Row>
              <Row>
              {
                _.map(sortie.sortieStatus, (status, index)=>{
                  if (status) {
                    let fleet = initFleet(getFleet(index+1), index*6)
                    return <FleetView fleet={fleet} count={times * sortieCount} omitDamage={true} key={index}/>
                  }
                })
              }
              </Row>
          <NextSpotInfo spotKind={this.props.spotKind}/>
          </Grid>
        }
      </div>
    )
  }
})

export default SortieViewArea