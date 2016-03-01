Promise = require 'bluebird'
async = Promise.coroutine
request = Promise.promisifyAll require('request')
{relative, join} = require 'path-extra'
path = require 'path-extra'
fs = require 'fs-extra'
CSON = require 'cson'
{_, $, $$, React, ReactBootstrap, ROOT, resolveTime, layout, toggleModal} = window
{Table, ProgressBar, Grid, Input, Col, Alert, Button, Divider} = ReactBootstrap
{APPDATA_PATH, SERVER_HOSTNAME} = window
window.i18n.prophet = new(require 'i18n-2')
  locales: ['en-US', 'ja-JP', 'zh-CN', 'zh-TW']
  defaultLocale: 'zh-CN'
  directory: path.join(__dirname, 'assets', 'i18n')
  devMode: false
  extension: '.json'
window.i18n.prophet.setLocale(window.language)
__ = window.i18n.prophet.__.bind(window.i18n.prophet)

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

formation = [
  __("Unknown Formation"),
  __("Line Ahead"),
  __("Double Line"),
  __("Diamond"),
  __("Echelon"),
  __("Line Abreast"),
  __("Cruising Formation 1"),
  __("Cruising Formation 2"),
  __("Cruising Formation 3"),
  __("Cruising Formation 4")
]

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

initHp =
  now: [0, 0, 0, 0, 0, 0]
  max: [0, 0, 0, 0, 0, 0]
  dmg: [0, 0, 0, 0, 0, 0]
  atk: [0, 0, 0, 0, 0, 0]

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
      injure: 0
      damage: 0
      dayInjure: 0
    @id = -1
    @lv = -1
    @cond = 0
    @name = "Null"
    @slot = []
    # owener: 0 ours 1 enemy
    @owner = 1
    @back = 0


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
  else
    _ship = window._ships[ship.id]
    ship.hp.now = _ship.api_nowhp
    ship.hp.max = _ship.api_maxhp
    ship.lv = _ship.api_lv
    ship.cond = _ship.api_cond
    ship.name = window.i18n.resources.__ _ship.api_name
    ship.slot = _ship.api_slot.concat(_ship.api_slot_ex || -1)
    ship.owner = 0

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

getEnemyInfo = (fleet, body, isPractice) ->
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

getResult = (mainFleet, enemyFleet, escortFleet) ->
  mainResult = new Result()
  enemyResult = new Result()
  mainFleet.mvp = enemyFleet.mvp = escortFleet.mvp = 0
  updateResult mainFleet, mainResult
  updateResult escortFleet, mainResult
  updateResult enemyFleet, enemyResult
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

TorpedoSalvo = (mainFleet, enemyFleet, raigeki) ->
  # 雷撃ターゲット
  for target, i in raigeki.api_frai
    continue if target <= 0
    mainFleet.ship[i - 1].hp.damage += updateInjure(enemyFleet.ship[target - 1], raigeki.api_fydam[i])
  # 雷撃ターゲット
  for target, i in raigeki.api_erai
    continue if target <= 0
    enemyFleet.ship[i - 1].hp.damage += updateInjure(mainFleet.ship[target - 1], raigeki.api_eydam[i])

Shelling = (mainFleet, enemyFleet, hougeki) ->
  for damageFrom, i in hougeki.api_at_list
    continue if damageFrom == -1
    for damage, j in hougeki.api_damage[i]
      target = hougeki.api_df_list[i][0]
      if target < 7
        enemyFleet.ship[damageFrom - 7].hp.damage += updateInjure(mainFleet.ship[target - 1], damage)
      else
        mainFleet.ship[damageFrom - 1].hp.damage += updateInjure(enemyFleet.ship[target - 7], damage)

getShipInfo = (mainFleet, deckId) ->
  {_ships} = window
  if deckId == -1
    for i in [0..5]
      mainFleet.ship[i].id = -1
      updateShip mainFleet.ship[i]
  else
    for shipId, i in window._decks[deckId].api_ship
      mainFleet.ship[i].id = shipId
      updateShip mainFleet.ship[i]

simulateAerial = (kouku, planeCount) ->
  if kouku.api_stage2?
    planeCount.sortie[0] -= kouku.api_stage2.api_f_lostcount
    planeCount.enemy[0] -= kouku.api_stage2.api_e_lostcount

simulateBattle = (mainFleet, enemyFleet, escortFleet, combinedFlag, body, planeCount) ->
  # First air battle
  if body.api_kouku?
    if body.api_kouku.api_stage1?
      tmp = body.api_kouku.api_stage1
      planeCount.seiku = tmp.api_disp_seiku
      planeCount.sortie[0] = tmp.api_f_count - tmp.api_f_lostcount
      planeCount.sortie[1] = tmp.api_f_count
      planeCount.enemy[0] = tmp.api_e_count - tmp.api_e_lostcount
      planeCount.enemy[1] = tmp.api_e_count
    simulateAerial body.api_kouku, planeCount
    if body.api_kouku.api_stage3?
      AerialCombat mainFleet, enemyFleet, body.api_kouku.api_stage3
    if body.api_kouku.api_stage3_combined?
      AerialCombat escortFleet, enemyFleet, body.api_kouku.api_stage3_combined
  # Second air battle
  if body.api_kouku2?
    simulateAerial body.api_kouku2, planeCount
    if body.api_kouku2.api_stage3?
      AerialCombat mainFleet, enemyFleet, body.api_kouku2.api_stage3
    if body.api_kouku2.api_stage3_combined?
      AerialCombat escortFleet, enemyFleet, body.api_kouku2.api_stage3_combined
  # Support battle
  if body.api_support_info?
    if body.api_support_info.api_support_airatack?
      SupportFire enemyFleet, body.api_support_info.api_support_airatack.api_stage3.api_edam
    else if body.api_support_info.api_support_hourai?
      SupportFire enemyFleet, body.api_support_info.api_support_hourai.api_damage
    else
      SupportFire enemyFleet, body.api_support_info.api_damage
  # Opening battle
  if body.api_opening_atack?
    if combinedFlag > 0
      TorpedoSalvo escortFleet, enemyFleet, body.api_opening_atack
    else
      TorpedoSalvo mainFleet, enemyFleet, body.api_opening_atack
  # Night battle
  if body.api_hougeki?
    if combinedFlag > 0
      Shelling escortFleet, enemyFleet, body.api_hougeki
    else
      Shelling mainFleet, enemyFleet, body.api_hougeki
  # First hougeki battle
  if body.api_hougeki1?
    if combinedFlag > 0 && combinedFlag != 2
      Shelling escortFleet, enemyFleet, body.api_hougeki1
    else
      Shelling mainFleet, enemyFleet, body.api_hougeki1
  # Second hougeki battle
  if body.api_hougeki2?
    Shelling mainFleet, enemyFleet, body.api_hougeki2
  # Combined hougeki battle
  if body.api_hougeki3?
    if combinedFlag == 2
      Shelling escortFleet, enemyFleet, body.api_hougeki3
    else
      Shelling mainFleet, enemyFleet, body.api_hougeki3
  # Raigeki battle
  if body.api_raigeki?
    if combinedFlag > 0
      TorpedoSalvo escortFleet, enemyFleet, body.api_raigeki
    else
      TorpedoSalvo mainFleet, enemyFleet, body.api_raigeki
  getResult mainFleet, enemyFleet, escortFleet

escapeId = towId = -1

module.exports =
  name: 'prophet'
  priority: 1
  displayName: <span><FontAwesome key={0} name='compass' />{' ' + __("Prophet")}</span>
  description: __ "Sortie Prophet"
  version: '3.8.5'
  author: 'Chiba'
  link: 'https://github.com/Chibaheit'
  reactClass: React.createClass
    getInitialState: ->
      # Load map data
      mapspot = null
      try
        mapspot = CSON.parseCSONFile path.join(__dirname, 'assets', 'data', 'mapspot.cson')
      catch
        console.log 'Failed to load map data!'

      mainFleet: new Fleet()
      enemyFleet: new Fleet()
      escortFleet: new Fleet()
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
      compactMode: false
      # Compass
      mapArea: NaN
      mapCell: NaN
      nowSpot: NaN
      nextSpot: NaN
      nextSpotKind: NaN
      MAPSPOT: mapspot

    handleResponse: (e) ->
      {method, path, body, postBody} = e.detail
      {mainFleet, enemyFleet, escortFleet, getShip, getItem, planeCount, enemyFormation, enemyIntercept, enemyName, result, enableProphetDamaged, prophetCondShow, combinedFlag, mapArea, mapCell, nowSpot, nextSpot, nextSpotKind} = @state
      {$useitems} = window
      enableProphetDamaged = config.get 'plugin.prophet.notify.damaged', true
      prophetCondShow = config.get 'plugin.prophet.show.cond', true
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
          result = null
          getShip = null
          getItem = null
          planeCount = Object.clone initPlaneCount
          # Compass
          mapArea = body.api_maparea_id
          mapCell = body.api_mapinfo_no
          nowSpot = 0
          nextSpot = body.api_no
          nextSpotKind = getCellInfo body.api_event_id, body.api_event_kind, body.api_bosscell_no, body.api_no
        # ship_deck in map
        when '/kcsapi/api_get_member/ship_deck'
          shouldRender = true
          escapeId = towId = -1
          for i in [0..5]
            enemyFleet.ship[i].id = -1
            updateShip enemyFleet.ship[i]
            updateShip mainFleet.ship[i]
            updateShip escortFleet.ship[i]
          enemyFormation = enemyIntercept = 0
          enemyName = __ 'Enemy Vessel'
          result = null
          getShip = null
          getItem = null
          planeCount = Object.clone initPlaneCount
        # Enter next point in battle
        when '/kcsapi/api_req_map/next'
          shouldRender = true
          # Comapss
          nowSpot = nextSpot
          nextSpot = body.api_no
          nextSpotKind = getCellInfo body.api_event_id, body.api_event_kind, body.api_bosscell_no, body.api_no
        # Normal battle
        when '/kcsapi/api_req_sortie/airbattle', '/kcsapi/api_req_battle_midnight/sp_midnight', '/kcsapi/api_req_sortie/battle', '/kcsapi/api_req_battle_midnight/battle', '/kcsapi/api_req_sortie/ld_airbattle'
          shouldRender = true
          # The damage in day battle
          if path != '/kcsapi/api_req_battle_midnight/battle'
            getEnemyInfo enemyFleet, body, false
          for i in [0..5]
            saveDayInjure mainFleet.ship[i]
            saveDayInjure enemyFleet.ship[i]
            saveDayInjure escortFleet.ship[i]
          result = simulateBattle mainFleet, enemyFleet, escortFleet, combinedFlag, body, planeCount
          for i in [0..5]
            loadDayInjure mainFleet.ship[i]
            loadDayInjure enemyFleet.ship[i]
            loadDayInjure escortFleet.ship[i]
        # Practice battle
        when '/kcsapi/api_req_practice/battle', '/kcsapi/api_req_practice/midnight_battle'
          shouldRender = true
          # If practice
          if path == '/kcsapi/api_req_practice/battle'
            enemyName = __ 'PvP'
            combinedFlag = 0
            getShipInfo mainFleet, postBody.api_deck_id - 1
            getEnemyInfo enemyFleet, body, true
          for i in [0..5]
            saveDayInjure mainFleet.ship[i]
            saveDayInjure enemyFleet.ship[i]
            saveDayInjure escortFleet.ship[i]
          result = simulateBattle mainFleet, enemyFleet, escortFleet, combinedFlag, body, planeCount
          for i in [0..5]
            loadDayInjure mainFleet.ship[i]
            loadDayInjure enemyFleet.ship[i]
            loadDayInjure escortFleet.ship[i]
        # Combined battle
        when '/kcsapi/api_req_combined_battle/airbattle', '/kcsapi/api_req_combined_battle/sp_midnight', '/kcsapi/api_req_combined_battle/battle', '/kcsapi/api_req_combined_battle/battle_water', '/kcsapi/api_req_combined_battle/midnight_battle', '/kcsapi/api_req_combined_battle/ld_airbattle'
          shouldRender = true
          if path != '/kcsapi/api_req_combined_battle/midnight_battle'
            getEnemyInfo enemyFleet, body, false
          for i in [0..5]
            saveDayInjure mainFleet.ship[i]
            saveDayInjure enemyFleet.ship[i]
            saveDayInjure escortFleet.ship[i]
          result = simulateBattle mainFleet, enemyFleet, escortFleet, combinedFlag, body, planeCount
          for i in [0..5]
            loadDayInjure mainFleet.ship[i]
            loadDayInjure enemyFleet.ship[i]
            loadDayInjure escortFleet.ship[i]
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
              if ship.hp.now < (0.2500001 * ship.hp.max) && ship.back == 1
                tmpShip = tmpShip + ship.name + " "
              ship = escortFleet.ship[i]
              if ship.hp.now < (0.2500001 * ship.hp.max) && ship.back == 1
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
            updateShip enemyFleet.ship[i]
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
          enemyFleet: enemyFleet
          escortFleet: escortFleet
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
      <div onDoubleClick={@handleDisplayModeSwitch}>
        <link rel="stylesheet" href={join(relative(ROOT, __dirname), 'assets', 'prophet.css')} />
        <ProphetPanel
          mainFleet={@state.mainFleet}
          enemyFleet={@state.enemyFleet}
          escortFleet={@state.escortFleet}
          HP={__ "HP"}
          sortieFleet={__ "Sortie Fleet"}
          enemyName={@state.enemyName}
          sortiePlane={@state.sortiePlane}
          enemyPlane={@state.enemyPlane}
          cols={if @state.combinedFlag == 0 then 0 else 1}
          lay={if layout == 'horizontal' || window.doubleTabbed then 0 else 1}
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
      <div className="form-group">
        <Grid>
          <Col xs={6}>
            <Button bsStyle={if @state.enableProphetDamaged then 'success' else 'danger'} onClick={@handleSetProphetDamaged} style={width: '100%'}>
              {if @state.enableProphetDamaged then '√ ' else ''}开启大破通知
            </Button>
          </Col>
          <Col xs={6}>
            <Button bsStyle={if @state.prophetCondShow then 'success' else 'danger'} onClick={@handleSetProphetCond} style={width: '100%'}>
              {if @state.prophetCondShow then '√ ' else ''}开启Cond显示
            </Button>
          </Col>
        </Grid>
      </div>
