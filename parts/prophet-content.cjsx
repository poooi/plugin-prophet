{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
ProphetInfo = require './prophet-info'
ProphetHp = require './prophet-hp'
module.exports = React.createClass
  render: ->
    if @props.isFirst == 1 || (@props.isFirst == 0 && @props.lay == 0)
      if @props.isFirst == 1
        <Table>
          <tbody>
            {
              for j in [0..5]
                if @props.lay == 0
                  if @props.cols == 0 && @props.mainFleet.ship[j].id == -1
                    continue
                  if @props.cols == 1 && @props.mainFleet.ship[j].id == -1 && @props.escortFleet.ship[j].id == -1
                    continue
                if @props.lay == 1
                  if @props.cols == 1 && @props.mainFleet.ship[j].id == -1 && @props.enemyFleet.ship[j].id == -1
                    continue
                  if @props.cols == 2 && @props.mainFleet.ship[j].id == -1 && @props.enemyFleet.ship[j].id == -1 && @props.escortFleet.ship[j].id == -1
                    continue
                list = []
                k = 0
                for i in [0..(@props.cols)]
                  if (i == @props.cols) && (@props.lay == 1)
                    list.push <ProphetInfo
                      key={++k}
                      ship={@props.enemyFleet.ship[j]}
                      condShow={0}
                      compactMode={@props.compactMode}
                      mvp={if @props.enemyFleet.mvp == j then true else false}/>
                    list.push <ProphetHp
                      key={++k}
                      ship={@props.enemyFleet.ship[j]}/>
                  else if i == 1
                    list.push <ProphetInfo
                      key={++k}
                      ship={@props.escortFleet.ship[j]}
                      condShow={1}
                      compactMode={@props.compactMode}
                      mvp={if @props.escortFleet.mvp == j then true else false}/>
                    list.push <ProphetHp
                      key={++k}
                      ship={@props.escortFleet.ship[j]}/>
                  else if i == 0
                    list.push <ProphetInfo
                      key={++k}
                      ship={@props.mainFleet.ship[j]}
                      condShow={1}
                      compactMode={@props.compactMode}
                      mvp={if @props.mainFleet.mvp == j then true else false}/>
                    list.push <ProphetHp
                      key={++k}
                      ship={@props.mainFleet.ship[j]}/>
                <tr key={j + 1}>
                  {list}
                </tr>
            }
          </tbody>
        </Table>
      else
        <Table>
          <tbody>
            {
              for j in [0..5]
                continue if @props.enemyFleet.ship[j].id == -1
                list = []
                k = 0
                for i in [0..0]
                  list.push <ProphetInfo
                    key={++k}
                    ship={@props.enemyFleet.ship[j]}
                    condShow={0}
                    compactMode={@props.compactMode}
                    mvp={if @props.enemyFleet.mvp == j then true else false}/>
                  list.push <ProphetHp
                    key={++k}
                    ship={@props.enemyFleet.ship[j]}/>
                <tr key={j + 6}>
                  {list}
                </tr>
            }
          </tbody>
        </Table>
    else
      <div></div>
