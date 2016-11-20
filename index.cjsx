Promise = require 'bluebird'
async = Promise.coroutine
request = Promise.promisifyAll require('request')
{relative, join} = require 'path-extra'
path = require 'path-extra'
fs = Promise.promisifyAll require 'fs-extra'
CSON = Promise.promisifyAll require 'cson'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, layout, toggleModal} = window
{Table, ProgressBar, Grid, Input, Col, Alert, Button, Divider} = ReactBootstrap
{APPDATA_PATH, SERVER_HOSTNAME} = window
__ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])

{store} = require 'views/create-store'
BottomAlert = require './parts/bottom-alert'
ProphetPanel = require './parts/prophet-panel'

window.addEventListener 'layout.change', (e) ->
  {layout} = e.detail

spotInfo = [
  __(''),
  __('Start'),
  __('Unknown'),
  __('Obtain Resources'),
  __('Lose Resources'),
  __('Battle'),
  __('Boss Battle'),
  __('Battle Avoid'),
  __('Air Strike'),
  __('Escort Success'),
  __('Transport Munitions'),
  __('Manual Selection'),
  __('Aerial Recon')
]

formation = {
  0: __("Unknown Formation"),
  1: __("Line Ahead"),
  2: __("Double Line"),
  3: __("Diamond"),
  4: __("Echelon"),
  5: __("Line Abreast"),
  11: __("Cruising Formation 1"),
  12: __("Cruising Formation 2"),
  13: __("Cruising Formation 3"),
  14: __("Cruising Formation 4"),
}

intercept = [
  __("Unknown Engagement"),
  __("Parallel Engagement"),
  __("Head-on Engagement"),
  __("Crossing the T (Advantage)"),
  __("Crossing the T (Disadvantage)")
]

dropCount = [
  0, 1, 1, 2, 2, 3, 4
]

dispSeiku = [
  __("Air Parity"),
  __("AS+"),
  __("AS"),
  __("Air Incapability"),
  __("Air Denial")
]

initPlaneCount =
  seiku: -1
  sortie: [0, 0]
  enemy: [0, 0]

initData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

class Ship
  constructor: () ->
    @hp =
      now: 0
      max: 0
      injure: 0 # the injure value
      damage: 0  # the damage value that it makes
      dayInjure: 0 # the daytime injure value has been got
    @id = -1
    @lv = -1
    @cond = 0
    @name = "Null"
    @slot = []
    # owner: 0 ours 1 enemy
    @owner = 1
    @back = 0 # 1: be taken to port


class Fleet
  constructor: () ->
    @ship = []
    for i in [0..5]
      @ship.push new Ship()
    @mvp = 0


class Result
  constructor: () ->
    @ruined = @count = 0
    @injure = @totalHp = 0.0
    @rate = 0.0

updateShip = (ship) ->
  ship.hp.injure = ship.hp.damage = 0
  if ship.id == -1
    ship.hp.now = ship.hp.max = 0
    ship.lv = -1
    ship.cond = 0
    ship.name = "Null"
    ship.slot = []
  else if ship.id > 0
    _ship = window._ships[ship.id]
    ship.hp.now = _ship.api_nowhp
    ship.hp.max = _ship.api_maxhp
    ship.lv = _ship.api_lv
    ship.cond = _ship.api_cond
    ship.name = window.i18n.resources.__ _ship.api_name
    ship.slot = _ship.api_slot.concat(_ship.api_slot_ex || -1)
    ship.owner = 0
  # else == -2: do nothing

updateResult = (fleet, result) ->
  fleet.mvp = 0
  for ship, i in fleet.ship
    tempHp = ship.hp.now + ship.hp.injure
    if tempHp > 0
      result.count += 1
      if ship.hp.now == 0
        result.totalHp += ship.hp.max
        result.injure += ship.hp.max
        result.ruined += 1
      else
        result.totalHp += tempHp
        result.injure += ship.hp.injure
        if ship.hp.now <= 0
          result.injure += ship.hp.now
          result.ruined += 1
          ship.hp.now = 0
    fleet.mvp = i if ship.hp.damage > fleet.ship[fleet.mvp].hp.damage

checkRepair = (ship) ->
  {_slotitems} = window
  for itemId in ship.slot
    continue if itemId == -1
    id = _slotitems[itemId].api_slotitem_id
    # 42 == Repair Team, 43 == Repair Goddess
    if id == 42
      ship.hp.now = Math.floor(ship.hp.max / 5)
      ship.hp.injure = 0
      break
    else if id == 43
      ship.hp.now = ship.hp.max
      ship.hp.injure = 0
      break

updateInjure = (ship, damage) ->
  damage = Math.floor(damage)
  damage = 0 if damage < 0
  if damage > 0
    ship.hp.injure += damage
    ship.hp.now -= damage
    if ship.hp.now <= 0 && ship.owner != 1
      checkRepair ship
  damage

saveDayInjure = (ship) ->
  ship.hp.dayInjure = ship.hp.injure

loadDayInjure = (ship)->
  ship.hp.injure -= ship.hp.dayInjure

getCellInfo = (eventId, eventKind, bossCell, CellNo) ->
  if bossCell is CellNo
    return 6
  if eventId is 6
    if eventKind is 1
      return 10
    else if eventKind is 2
      return 11
  else if eventId is 7
    if eventKind is 0
      return 12
  return eventId + 1

getEnemyInfo = (fleet, escort, body, isPractice) ->
  {$ships, _ships} = window
  for i in [0..5]
    shipId = body.api_ship_ke[i + 1]
    continue if shipId == -1
    fleet.ship[i].hp.now = body.api_maxhps[i + 7]
    fleet.ship[i].hp.max = body.api_maxhps[i + 7]
    fleet.ship[i].hp.injure = fleet.ship[i].hp.damage = 0
    fleet.ship[i].id = shipId
    fleet.ship[i].lv = body.api_ship_lv[i + 1]
    fleet.ship[i].slot = body.api_eSlot[i].slice()
    fleet.ship[i].owner = 1
    shipName = window.i18n.resources.__ $ships[shipId].api_name
    if $ships[shipId].api_yomi != '-' && !isPractice
      fleet.ship[i].name = shipName + $ships[shipId].api_yomi
    else
      fleet.ship[i].name = shipName
  if body.api_ship_ke_combined
    for i in [0..5]
      shipId = body.api_ship_ke_combined[i + 1]
      continue if shipId == -1
      escort.ship[i].hp.now = body.api_maxhps_combined[i + 7]
      escort.ship[i].hp.max = body.api_maxhps_combined[i + 7]
      escort.ship[i].hp.injure = escort.ship[i].hp.damage = 0
      escort.ship[i].id = shipId
      escort.ship[i].lv = body.api_ship_lv_combined[i + 1]
      escort.ship[i].slot = body.api_eSlot_combined[i].slice()
      escort.ship[i].owner = 1
      shipName = window.i18n.resources.__ $ships[shipId].api_name
      if $ships[shipId].api_yomi != '-' && !isPractice
        escort.ship[i].name = shipName + $ships[shipId].api_yomi
      else
        escort.ship[i].name = shipName

getResult = (mainFleet, enemyFleet, escortFleet, enemyEscort) ->
  mainResult = new Result()
  enemyResult = new Result()
  mainFleet.mvp = enemyFleet.mvp = escortFleet.mvp = 0
  updateResult mainFleet, mainResult
  updateResult escortFleet, mainResult
  updateResult enemyFleet, enemyResult
  updateResult enemyEscort, enemyResult
  enemyResult.rate = Math.floor(mainResult.injure / mainResult.totalHp * 100)
  mainResult.rate = Math.floor(enemyResult.injure / enemyResult.totalHp * 100)
  equalOrMore = mainResult.rate > 0.9 * enemyResult.rate
  resultB = mainResult.rate > 0 && mainResult.rate > 2.5 * enemyResult.rate
  if enemyResult.ruined == enemyResult.count
    return 'S'
  else if enemyResult.ruined >= dropCount[enemyResult.count]
    return 'A'
  else if enemyFleet.ship[0].hp.now <= 0 || resultB
    return 'B'
  if enemyResult.rate > 0
    if equalOrMore
      return 'C'
  return 'D'

AerialCombat = (mainFleet, enemyFleet, kouku) ->
  if kouku.api_edam?
    for damage, i in kouku.api_edam
      updateInjure enemyFleet.ship[i - 1], damage
  if kouku.api_fdam?
    for damage, i in kouku.api_fdam
      updateInjure mainFleet.ship[i - 1], damage

SupportFire = (enemyFleet, support) ->
  for damage, i in support
    continue if i > 6
    updateInjure enemyFleet.ship[i - 1], damage

# TODO: our combined fleet
TorpedoSalvo = (mainFleet, enemyFleet, enemyEscort, raigeki) ->
  # 雷撃ターゲット
  for target, i in raigeki.api_frai
    continue if target <= 0
    if target <= 6
      mainFleet.ship[i - 1].hp.damage += updateInjure(enemyFleet.ship[target - 1], raigeki.api_fydam[i])
    else
      mainFleet.ship[i - 1].hp.damage += updateInjure(enemyEscort.ship[target - 7], raigeki.api_fydam[i])
  # 雷撃ターゲット
  for target, i in raigeki.api_erai
    continue if target <= 0
    if i <= 6
      enemyFleet.ship[i - 1].hp.damage += updateInjure(mainFleet.ship[target - 1], raigeki.api_eydam[i])
    else
      enemyEscort.ship[i - 7].hp.damage += updateInjure(mainFleet.ship[target - 1], raigeki.api_eydam[i])

Shelling = (mainFleet, enemyFleet, enemyEscort, hougeki) ->
  for at, i in hougeki.api_at_list
    continue if at == -1
    at -= 1                             # Attacker
    df = hougeki.api_df_list[i][0] - 1  # Defender
    if hougeki.api_at_eflag?
      fromEnemy = hougeki.api_at_eflag[i] == 1
    else
      fromEnemy = df < 6
      if at >= 6 then at -= 6
      if df >= 6 then df -= 6
    for damage, j in hougeki.api_damage[i]
      if fromEnemy
        if at < 6
          enemyFleet.ship[at].hp.damage += updateInjure(mainFleet.ship[df], damage)
        else
          enemyEscort.ship[at - 6].hp.damage += updateInjure(mainFleet.ship[df], damage)
      else
        if df < 6
          mainFleet.ship[at].hp.damage += updateInjure(enemyFleet.ship[df], damage)
        else
          mainFleet.ship[at].hp.damage += updateInjure(enemyEscort.ship[df - 6], damage)

getShipInfo = (mainFleet, deckId) ->
  {_ships} = window
  for i in [0..5]
    mainFleet.ship[i].id = -1
    updateShip mainFleet.ship[i]
  if deckId != -1
    for shipId, i in window._decks[deckId].api_ship
      mainFleet.ship[i].id = shipId
      updateShip mainFleet.ship[i]

getAirBaseInfo = (airBaseFleet, body) ->
  for i in [0..5]
    airbase = body[i]
    ship = airBaseFleet.ship[i]

    if airbase?
      ship.id = -2
      ship.hp.max = ship.hp.now = 200
      ship.hp.damage = ship.hp.injure = 0
      ship.name = airbase.api_name
      ship.slot = airbase.api_plane_info.map (p) ->
        if p.api_slotid <= 0 then 0 else _slotitems[p.api_slotid].api_slotitem_id
    else
      ship.id = -1
      updateShip ship

simulateDestructionBattle = (airBaseFleet, enemyFleet, body, planeCount) ->
  for ship, i in airBaseFleet.ship
    ship.hp.injure = ship.hp.damage = 0
    ship.hp.now = body.api_nowhps[i + 1]
    ship.hp.max = body.api_maxhps[i + 1]
    ship.lv = body.api_ship_lv[i + 1]
  if body.api_air_base_attack?
    attack = body.api_air_base_attack
    simulateKoukuStage1 attack.api_stage1, planeCount if attack.api_stage1?
    AerialCombat airBaseFleet, enemyFleet, attack.api_stage3 if attack.api_stage3?


simulateAerial = (kouku, planeCount) ->
  if kouku.api_stage2?
    planeCount.sortie[0] -= kouku.api_stage2.api_f_lostcount
    planeCount.enemy[0] -= kouku.api_stage2.api_e_lostcount

simulateKoukuStage1 = (body, planeCount) ->
    planeCount.seiku = body.api_disp_seiku
    planeCount.sortie[0] = body.api_f_count - body.api_f_lostcount
    planeCount.sortie[1] = body.api_f_count
    planeCount.enemy[0] = body.api_e_count - body.api_e_lostcount
    planeCount.enemy[1] = body.api_e_count

simulateBattle = (mainFleet, escortFleet, combinedFlag, enemyFleet, enemyEscort, enemyCombined, body, planeCount) ->
  # First air battle
  if body.api_kouku?
    if body.api_kouku.api_stage1?
      simulateKoukuStage1 body.api_kouku.api_stage1, planeCount
    simulateAerial body.api_kouku, planeCount
    if body.api_kouku.api_stage3?
      AerialCombat mainFleet, enemyFleet, body.api_kouku.api_stage3
    if body.api_kouku.api_stage3_combined?
      AerialCombat escortFleet, enemyEscort, body.api_kouku.api_stage3_combined
  # Second air battle
  if body.api_kouku2?
    simulateAerial body.api_kouku2, planeCount
    if body.api_kouku2.api_stage3?
      AerialCombat mainFleet, enemyFleet, body.api_kouku2.api_stage3
    if body.api_kouku2.api_stage3_combined?
      AerialCombat escortFleet, enemyEscort, body.api_kouku2.api_stage3_combined
  # Support battle
  # TODO: No support fleet on 6-5, so...
  if body.api_support_info?
    if body.api_support_info.api_support_airatack?
      SupportFire enemyFleet, body.api_support_info.api_support_airatack.api_stage3.api_edam
    else if body.api_support_info.api_support_hourai?
      SupportFire enemyFleet, body.api_support_info.api_support_hourai.api_damage
    else
      SupportFire enemyFleet, body.api_support_info.api_damage
  if body.api_air_base_attack?
    for airBase in body.api_air_base_attack
      if airBase.api_stage3?
        AerialCombat mainFleet, enemyFleet, airBase.api_stage3
      if airBase.api_stage3_combined?
        AerialCombat escortFleet, enemyEscort, airBase.api_stage3_combined
  # Opening taisen
  if body.api_opening_taisen?
    if combinedFlag > 0
      Shelling escortFleet, enemyFleet, enemyEscort, body.api_opening_taisen
    else
      Shelling mainFleet, enemyFleet, enemyEscort, body.api_opening_taisen
  # Opening battle
  if body.api_opening_atack?
    if combinedFlag > 0
      TorpedoSalvo escortFleet, enemyFleet, enemyEscort, body.api_opening_atack
    else
      TorpedoSalvo mainFleet, enemyFleet, enemyEscort, body.api_opening_atack
  # Night battle
  if body.api_hougeki?
     if enemyCombined > 0
      if body.api_active_deck[1] == 1
        Shelling mainFleet, enemyFleet, null, body.api_hougeki
      else
        Shelling mainFleet, enemyEscort, null, body.api_hougeki
     else
      if combinedFlag > 0
        Shelling escortFleet, enemyFleet, enemyEscort, body.api_hougeki
      else
        Shelling mainFleet, enemyFleet, enemyEscort, body.api_hougeki
  # First hougeki battle
  if body.api_hougeki1?
    if combinedFlag > 0 && combinedFlag != 2
      Shelling escortFleet, enemyFleet, enemyEscort, body.api_hougeki1
    else
      Shelling mainFleet, enemyFleet, enemyEscort, body.api_hougeki1
  # Second hougeki battle
  if body.api_hougeki2?
    Shelling mainFleet, enemyFleet, enemyEscort, body.api_hougeki2
  # Combined hougeki battle
  if body.api_hougeki3?
    if combinedFlag == 2
      Shelling escortFleet, enemyFleet, enemyEscort, body.api_hougeki3
    else
      Shelling mainFleet, enemyFleet, enemyEscort, body.api_hougeki3
  # Raigeki battle
  if body.api_raigeki?
    if combinedFlag > 0
      TorpedoSalvo escortFleet, enemyFleet, enemyEscort, body.api_raigeki
    else
      TorpedoSalvo mainFleet, enemyFleet, enemyEscort, body.api_raigeki
  getResult mainFleet, enemyFleet, escortFleet, enemyEscort

escapeId = towId = -1

module.exports =
  name: 'prophet'
  priority: 1
  displayName: <span><FontAwesome key={0} name='compass' />{' ' + __("Prophet")}</span>
  description: __ "Sortie Prophet"
  author: 'Chiba'
  link: 'https://github.com/Chibaheit'
  reducer: (state={}, action) ->
    if (action.type == '@@poi-plugin-prophet/updateMapspot')
      return Object.assign(state, mapspot: action.data)
    if (action.type == '@@poi-plugin-prophet/updateMaproute')
      return Object.assign(state, maproute: action.data)
    state

  reactClass: React.createClass
    getInitialState: ->
      # Load map data
      mapspot = null
      mainFleet: new Fleet()
      escortFleet: new Fleet()
      airBaseFleet: new Fleet()
      enemyFleet: new Fleet()
      enemyEscort: new Fleet()
      getShip: null
      getItem: null
      planeCount: Object.clone initPlaneCount
      sortiePlane: ''
      enemyPlane: ''
      seiku: null
      enemyFormation: 0
      enemyIntercept: 0
      enemyName: __("Enemy Vessel")
      result: null
      enableProphetDamaged: config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow: config.get 'plugin.prophet.show.cond', true
      combinedFlag: 0
      enemyCombined: 0
      compactMode: false
      destructionBattleFlag: false
      # Compass
      mapArea: NaN
      mapCell: NaN
      nowSpot: NaN
      nextSpot: NaN
      nextSpotKind: NaN
      MAPSPOT: mapspot

    componentWillMount: ->
      fs.readFileAsync(join(__dirname, 'assets', 'data', 'mapspot.cson'))
        .then (data) =>
          mapspot = CSON.parseCSONString data
          @setState {MAPSPOT: mapspot}
          store.dispatch
            type: '@@poi-plugin-prophet/updateMapspot'
            data: mapspot
        .catch (e) =>
          console.log 'Failed to load map data!', e.stack
      fs.readFileAsync(join(__dirname, 'assets', 'data', 'maproute.cson'))
        .then (data) =>
          maproute = CSON.parseCSONString data
          store.dispatch
            type: '@@poi-plugin-prophet/updateMaproute'
            data: maproute
        .catch (e) =>
          console.log 'Failed to load map route!', e.stack

    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {mainFleet, escortFleet, enemyFleet, enemyEscort, airBaseFleet, getShip, getItem, planeCount, enemyFormation, enemyIntercept, enemyName, result, enableProphetDamaged, prophetCondShow, combinedFlag, enemyCombined, mapArea, mapCell, nowSpot, nextSpot, nextSpotKind} = @state
      {$useitems} = window
      enableProphetDamaged = config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow = config.get 'plugin.prophet.show.cond', true
      destructionBattleFlag = false
      shouldRender = false
      switch path
        # First enter map in battle
        when '/kcsapi/api_req_map/start'
          shouldRender = true
          if parseInt(postBody.api_deck_id) != 1
            combinedFlag = 0
          if combinedFlag <= 0
            getShipInfo mainFleet, postBody.api_deck_id - 1
            getShipInfo escortFleet, -1
          else
            getShipInfo mainFleet, 0
            getShipInfo escortFleet, 1
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          enemyCombined = 0
          result = null
          getShip = null
          getItem = null
          planeCount = Object.clone initPlaneCount
          # Compass
          mapArea = body.api_maparea_id
          mapCell = body.api_mapinfo_no
          nowSpot = body.api_from_no || 0
          nextSpot = body.api_no
          nextSpotKind = getCellInfo body.api_event_id, body.api_event_kind, body.api_bosscell_no, body.api_no
        when '/kcsapi/api_get_member/base_air_corps'
          shouldRender = false
          getAirBaseInfo airBaseFleet, body
        # ship_deck in map
        when '/kcsapi/api_get_member/ship_deck'
          shouldRender = true
          escapeId = towId = -1
          for i in [0..5]
            updateShip mainFleet.ship[i]
            updateShip escortFleet.ship[i]
            enemyFleet.ship[i].id = -1
            updateShip enemyFleet.ship[i]
            enemyEscort.ship[i].id = -1
            updateShip enemyEscort.ship[i]
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          enemyCombined = 0
          result = null
          getShip = null
          getItem = null
          planeCount = Object.clone initPlaneCount
        # Enter next point in battle
        when '/kcsapi/api_req_map/next'
          shouldRender = true
          # Destruction battle
          if body.api_destruction_battle?
            destructionBattleFlag = true
            getEnemyInfo enemyFleet, enemyEscort, body.api_destruction_battle, false
            simulateDestructionBattle airBaseFleet, enemyFleet, body.api_destruction_battle, planeCount
          # Compass
          nowSpot = nextSpot
          nextSpot = body.api_no
          nextSpotKind = getCellInfo body.api_event_id, body.api_event_kind, body.api_bosscell_no, body.api_no
        # Normal battle
        when '/kcsapi/api_req_sortie/airbattle', '/kcsapi/api_req_battle_midnight/sp_midnight', '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_sortie/ld_airbattle', '/kcsapi/api_req_combined_battle/ec_battle', '/kcsapi/api_req_combined_battle/ec_midnight_battle'
          shouldRender = true
          # The damage in day battle
          if path not in ['/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_combined_battle/ec_midnight_battle']
            getEnemyInfo enemyFleet, enemyEscort, body, false
          if path in ['/kcsapi/api_req_combined_battle/ec_battle', '/kcsapi/api_req_combined_battle/ec_midnight_battle']
            enemyCombined = 1
          else
            enemyCombined = 0
          for i in [0..5]
            saveDayInjure mainFleet.ship[i]
            saveDayInjure escortFleet.ship[i]
            saveDayInjure enemyFleet.ship[i]
            saveDayInjure enemyEscort.ship[i]
          result = simulateBattle mainFleet, escortFleet, combinedFlag, enemyFleet, enemyEscort, enemyCombined, body, planeCount
          for i in [0..5]
            loadDayInjure mainFleet.ship[i]
            loadDayInjure escortFleet.ship[i]
            loadDayInjure enemyFleet.ship[i]
            loadDayInjure enemyEscort.ship[i]
        # Practice battle
        when '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_practice/midnight_battle'
          shouldRender = true
          # If practice
          if path == '/kcsapi/api_req_practice/battle'
            enemyName = __ 'PvP'
            combinedFlag = 0
            getShipInfo mainFleet, postBody.api_deck_id - 1
            getEnemyInfo enemyFleet, enemyEscort, body, true
          for i in [0..5]
            saveDayInjure mainFleet.ship[i]
            saveDayInjure enemyFleet.ship[i]
            saveDayInjure escortFleet.ship[i]
            saveDayInjure enemyEscort.ship[i]
          result = simulateBattle mainFleet, escortFleet, combinedFlag, enemyFleet, enemyEscort, enemyCombined, body, planeCount
          for i in [0..5]
            loadDayInjure mainFleet.ship[i]
            loadDayInjure enemyFleet.ship[i]
            loadDayInjure escortFleet.ship[i]
            loadDayInjure enemyEscort.ship[i]
        # Combined battle
        when '/kcsapi/api_req_combined_battle/airbattle', '/kcsapi/api_req_combined_battle/sp_midnight', '/kcsapi/api_req_combined_battle/battle', '/kcsapi/api_req_combined_battle/battle_water', '/kcsapi/api_req_combined_battle/midnight_battle', '/kcsapi/api_req_combined_battle/ld_airbattle'
          shouldRender = true
          if path != '/kcsapi/api_req_combined_battle/midnight_battle'
            getEnemyInfo enemyFleet, enemyEscort, body, false
          for i in [0..5]
            saveDayInjure mainFleet.ship[i]
            saveDayInjure enemyFleet.ship[i]
            saveDayInjure escortFleet.ship[i]
            saveDayInjure enemyEscort.ship[i]
          result = simulateBattle mainFleet, escortFleet, combinedFlag, enemyFleet, enemyEscort, enemyCombined, body, planeCount
          for i in [0..5]
            loadDayInjure mainFleet.ship[i]
            loadDayInjure enemyFleet.ship[i]
            loadDayInjure escortFleet.ship[i]
            loadDayInjure enemyEscort.ship[i]
        # Battle Result
        when '/kcsapi/api_req_practice/battle_result', '/kcsapi/api_req_sortie/battleresult', '/kcsapi/api_req_combined_battle/battleresult'
          shouldRender = true
          if path != '/kcsapi/api_req_practice/battle_result'
            if body.api_escape_flag? && body.api_escape_flag > 0
              escapeId = body.api_escape.api_escape_idx[0] - 1
              towId = body.api_escape.api_tow_idx[0] - 1
            tmpShip = ""
            for i in [0..5]
              ship = mainFleet.ship[i]
              if ship.hp.now < (0.2500001 * ship.hp.max) && ship.back == 0
                tmpShip = tmpShip + ship.name + " "
              ship = escortFleet.ship[i]
              if ship.hp.now < (0.2500001 * ship.hp.max) && ship.back == 0
                tmpShip = tmpShip + ship.name + " "
            if tmpShip != "" and @state.enableProphetDamaged
              notify "#{tmpShip}" + __('Heavily damaged'),
                type: 'damaged'
                icon: join(ROOT, 'views', 'components', 'main', 'assets', 'img', 'state', '4.png')
                audio: config.get('plugin.prophet.notify.damagedAudio')
            if body.api_get_ship?
              getShip = body.api_get_ship
            if body.api_get_useitem?
              getItem = $useitems[body.api_get_useitem.api_useitem_id]?.api_name
          if body.api_mvp?
            mainFleet.mvp = if body.api_mvp >= 2 then body.api_mvp - 1 else 0
          if body.api_mvp_combined?
            escortFleet.mvp = if body.api_mvp_combined >= 2 then body.api_mvp_combined - 1 else 0
          result = body.api_win_rank
        # Some ship while go back
        when '/kcsapi/api_req_combined_battle/goback_port'
          shouldRender = true
          if escapeId != -1 && towId != -1
            if escapeId < 6
              mainFleet.ship[escapeId].back = 1
            else
              escortFleet.ship[escapeId - 6].back = 1
            if towId < 6
              mainFleet.ship[towId].back = 1
            else
              escortFleet.ship[towId - 6].back = 1
        # Refresh deck status
        when '/kcsapi/api_port/port'
        ,    '/kcsapi/api_req_hensei/change', '/kcsapi/api_req_hensei/preset_select' # Refresh if hensei changes
        ,    '/kcsapi/api_req_nyukyo/start', '/kcsapi/api_req_nyukyo/speedchange' # Refresh when repairing
        ,    '/kcsapi/api_req_kousyou/destroyship' # In case if any ship in the fleet is destroyed
        ,    '/kcsapi/api_req_hensei/combined' # When combined fleet is formed/disbanded
          shouldRender = true
          if path == '/kcsapi/api_port/port'
            escapeId = towId = -1
            if body.api_combined_flag?
              combinedFlag = body.api_combined_flag
            else
              combinedFlag = 0
            ship.back = 0 for ship in mainFleet.ship
            ship.back = 0 for ship in escortFleet.ship
          if path == '/kcsapi/api_req_hensei/combined'
            combinedFlag = parseInt(postBody.api_combined_type)
          if combinedFlag <= 0
            getShipInfo mainFleet, 0
            getShipInfo escortFleet, -1
          else
            getShipInfo mainFleet, 0
            getShipInfo escortFleet, 1
          for i in [0..5]
            enemyFleet.ship[i].id = -1
            enemyEscort.ship[i].id = -1
            updateShip enemyFleet.ship[i]
            updateShip enemyEscort.ship[i]
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          getItem = null
          planeCount = Object.clone initPlaneCount
          # Compass
          mapArea = NaN
          mapCell = NaN
          nowSpot = NaN
          nextSpot = NaN
          nextSpotKind = NaN
      if body.api_formation?
        enemyFormation = body.api_formation[1]
        enemyIntercept = body.api_formation[2]
      sortiePlane = enemyPlane = ""
      seiku = __ "Unknown FC"
      if planeCount.seiku != -1
        if planeCount.sortie[1] != 0
          sortiePlane = " #{planeCount.sortie[0]}/#{planeCount.sortie[1]}"
        if planeCount.enemy[1] != 0
          enemyPlane = " #{planeCount.enemy[0]}/#{planeCount.enemy[1]}"
        seiku = dispSeiku[planeCount.seiku]
      if shouldRender
        @setState
          mainFleet: mainFleet
          escortFleet: escortFleet
          enemyFleet: enemyFleet
          enemyEscort: enemyEscort
          airBaseFleet: airBaseFleet
          getShip: getShip
          getItem: getItem
          planeCount: planeCount
          sortiePlane: sortiePlane
          enemyPlane: enemyPlane
          seiku: seiku
          enemyFormation: enemyFormation
          enemyIntercept: enemyIntercept
          enemyName: enemyName
          result: result
          enableProphetDamaged: enableProphetDamaged
          prophetCondShow: prophetCondShow
          combinedFlag: combinedFlag
          enemyCombined: enemyCombined
          destructionBattleFlag: destructionBattleFlag
          # Compass
          mapArea: mapArea
          mapCell: mapCell
          nowSpot: nowSpot
          nextSpot: nextSpot
          nextSpotKind: nextSpotKind

    handleDisplayModeSwitch: ->
      @setState
        compactMode: !@state.compactMode

    componentDidMount: ->
      window.addEventListener 'game.response', @handleResponse

    componentWillUnmount: ->
      window.removeEventListener 'game.response', @handleResponse

    getCompassAngle: ->
      {MAPSPOT, mapArea, mapCell, nowSpot, nextSpot} = @state
      return null unless mapspot = MAPSPOT?[mapArea]?[mapCell]
      return null unless nowPoint = mapspot[nowSpot]
      return null unless nextPoint = mapspot[nextSpot]
      # Calucate and translate to css rorate angle
      angle = Math.atan2(nextPoint[1] - nowPoint[1], nextPoint[0] - nowPoint[0]) / Math.PI * 180
      angle = angle + 90

    render: ->
      <div id='prophet' className="form-group prophet" onDoubleClick={@handleDisplayModeSwitch}>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'prophet.css')} />
        <ProphetPanel
          mainFleet={if @state.destructionBattleFlag then @state.airBaseFleet else @state.mainFleet}
          escortFleet={@state.escortFleet}
          enemyFleet={@state.enemyFleet}
          enemyEscort={@state.enemyEscort}
          enemyCombined={@state.enemyCombined}
          destructionBattleFlag={@state.destructionBattleFlag}
          HP={__ "HP"}
          sortieFleet={__ "Sortie Fleet"}
          enemyName={@state.enemyName}
          sortiePlane={@state.sortiePlane}
          enemyPlane={@state.enemyPlane}
          sortieCount={if @state.destructionBattleFlag || @state.combinedFlag <= 0 then 1 else 2}
          isHorizontal={if layout == 'horizontal' || window.doubleTabbed then 0 else 1}
          enemyCount={if @state.enemyCombined <= 0 then 1 else 2}
          compactMode={@state.compactMode}/>
        <BottomAlert
          admiral={__ "Admiral"}
          getShip={@state.getShip}
          getItem={@state.getItem}
          joinFleet={__ "Join fleet"}
          formationNum={@state.enemyFormation}
          formation={formation[@state.enemyFormation]}
          intercept={intercept[@state.enemyIntercept]}
          seiku={@state.seiku}
          result={@state.result}
          compassPoint={__ "Compass Point"}
          compassAngle={@getCompassAngle()}
          nextSpot={__ "Next Spot"}
          nextSpotInfo={if @state.nextSpot then "#{spotInfo[@state.nextSpotKind]} (#{@state.nextSpot})"}/>
      </div>
  settingsClass: React.createClass
    getInitialState: ->
      enableProphetDamaged: config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow: config.get 'plugin.prophet.show.cond', true
    handleSetProphetDamaged: ->
      {enableProphetDamaged} = @state
      config.set 'plugin.prophet.notify.damaged', !enableProphetDamaged
      @setState
        enableProphetDamaged: !enableProphetDamaged
    handleSetProphetCond: ->
      {prophetCondShow} = @state
      config.set 'plugin.prophet.show.cond', !prophetCondShow
      @setState
        prophetCondShow: !prophetCondShow
    render: ->
      <div>
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.enableProphetDamaged then 'success' else 'danger'} onClick={@handleSetProphetDamaged} style={width: '100%'}>
              {if @state.enableProphetDamaged then '√ ' else ''}{__ 'Heavily damaged notification'}
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle={if @state.prophetCondShow then 'success' else 'danger'} onClick={@handleSetProphetCond} style={width: '100%'}>
              {if @state.prophetCondShow then '√ ' else ''}{__ 'Condition display'}
            </Button>
          </Col>
        </Grid>
      </div>
