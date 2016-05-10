{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap
NavigationBar = require './navigation-bar'
ProphetContent = require './prophet-content'
module.exports = React.createClass
  render: ->
    <div>
      <NavigationBar
        HP={@props.HP}
        sortieFleet={@props.sortieFleet}
        enemyName={@props.enemyName}
        sortiePlane={@props.sortiePlane}
        enemyPlane={@props.enemyPlane}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        enemyFleet={@props.enemyFleet}
        isFirst={1} />
      <ProphetContent
        mainFleet={@props.mainFleet}
        enemyFleet={@props.enemyFleet}
        escortFleet={@props.escortFleet}
        destructionBattleFlag={@props.destructionBattleFlag}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        isFirst={1}
        compactMode={@props.compactMode}/>
      <NavigationBar
        HP={@props.HP}
        sortieFleet={@props.sortieFleet}
        enemyName={@props.enemyName}
        sortiePlane={@props.sortiePlane}
        enemyPlane={@props.enemyPlane}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        enemyFleet={@props.enemyFleet}
        isFirst={0} />
      <ProphetContent
        mainFleet={@props.mainFleet}
        enemyFleet={@props.enemyFleet}
        escortFleet={@props.escortFleet}
        destructionBattleFlag={@props.destructionBattleFlag}
        cols={@props.cols + @props.lay}
        lay={@props.lay}
        isFirst={0}
        compactMode={@props.compactMode}/>
    </div>
