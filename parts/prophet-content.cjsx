{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
ProphetInfo = require './prophet-info'
ProphetHp = require './prophet-hp'
module.exports = React.createClass
  render: ->
    list = []
    if @props.isFirst == 1
      for idx in [0..5]
        tmp = []
        if @props.isHorizontal == 0
          if @props.sortieCount == 1 && @props.mainFleet.ship[idx].id == -1
            continue
          if @props.sortieCount == 2 && @props.mainFleet.ship[idx].id == -1 && @props.escortFleet.ship[idx].id == -1
            continue
        else
          if @props.sortieCount == 1 && @props.mainFleet.ship[idx].id == -1 && @props.enemyCount == 1 && @props.enemyFleet.ship[idx].id == -1
            continue
          if @props.sortieCount == 1 && @props.mainFleet.ship[idx].id == -1 && @props.enemyCount == 2 && @props.enemyFleet.ship[idx].id == -1 && @props.enemyEscort.ship[idx].id == -1
            continue
          if @props.sortieCount == 2 && @props.mainFleet.ship[idx].id == -1 && @props.escortFleet.ship[idx].id == -1 && @props.enemyCount == 1 && @props.enemyFleet.ship[idx].id == -1
            continue
          if @props.sortieCount == 2 && @props.mainFleet.ship[idx].id == -1 && @props.escortFleet.ship[idx].id == -1 && @props.enemyCount == 2 && @props.enemyFleet.ship[idx].id == -1 && @props.enemyEscort.ship[idx].id == -1
            continue
        tmp.push <ProphetInfo
          ship={@props.mainFleet.ship[idx]}
          condShow={!@props.destructionBattleFlag}
          compactMode={@props.compactMode}
          mvp={if @props.mainFleet.mvp == idx then true else false}/>
        tmp.push <ProphetHp ship={@props.mainFleet.ship[idx]}/>
        if @props.sortieCount == 2
          tmp.push <ProphetInfo
            ship={@props.escortFleet.ship[idx]}
            condShow={!@props.destructionBattleFlag}
            compactMode={@props.compactMode}
            mvp={if @props.escortFleet.mvp == idx then true else false}/>
          tmp.push <ProphetHp ship={@props.escortFleet.ship[idx]}/>
        if @props.isHorizontal == 1
          if @props.enemyCount == 2
            tmp.push <ProphetInfo
              ship={@props.enemyEscort.ship[idx]}
              condShow={0}
              compactMode={@props.compactMode}
              mvp={false}/>
            tmp.push <ProphetHp ship={@props.enemyEscort.ship[idx]}/>
          tmp.push <ProphetInfo
            ship={@props.enemyFleet.ship[idx]}
            condShow={0}
            compactMode={@props.compactMode}
            mvp={if @props.enemyFleet.mvp == idx then true else false}/>
          tmp.push <ProphetHp ship={@props.enemyFleet.ship[idx]}/>
        list.push <div className="prophet-content-row">{tmp}</div>
    else if @props.enemyFleet.ship[0].id != -1 && @props.isHorizontal == 0
      for idx in [0..5]
        tmp = []
        if @props.enemyCount == 1 && @props.enemyFleet.ship[idx].id == -1
          continue
        if @props.enemyCount == 2 && @props.enemyFleet.ship[idx].id == -1 && @props.enemyEscort.ship[idx].id == -1
          continue
        if @props.enemyCount == 2
          tmp.push <ProphetInfo
            ship={@props.enemyEscort.ship[idx]}
            condShow={0}
            compactMode={@props.compactMode}
            mvp={false}/>
          tmp.push <ProphetHp ship={@props.enemyEscort.ship[idx]}/>
        tmp.push <ProphetInfo
          ship={@props.enemyFleet.ship[idx]}
          condShow={0}
          compactMode={@props.compactMode}
          mvp={if @props.enemyFleet.mvp == idx then true else false}/>
        tmp.push <ProphetHp ship={@props.enemyFleet.ship[idx]}/>
        list.push <div className="prophet-content-row">{tmp}</div>
    <div className="prophet-content">{list}</div>
