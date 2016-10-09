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
        sortieCount={@props.sortieCount}
        isHorizontal={@props.isHorizontal}
        enemyCount={@props.enemyCount}
        enemyFleet={@props.enemyFleet}
        enemyEscort={@props.enemyEscort}
        isFirst={1} />
      <ProphetContent
        mainFleet={@props.mainFleet}
        enemyFleet={@props.enemyFleet}
        enemyEscort={@props.enemyEscort}
        escortFleet={@props.escortFleet}
        destructionBattleFlag={@props.destructionBattleFlag}
        sortieCount={@props.sortieCount}
        isHorizontal={@props.isHorizontal}
        enemyCount={@props.enemyCount}
        isFirst={1}
        compactMode={@props.compactMode}/>
      <NavigationBar
        HP={@props.HP}
        sortieFleet={@props.sortieFleet}
        enemyName={@props.enemyName}
        sortiePlane={@props.sortiePlane}
        enemyPlane={@props.enemyPlane}
        sortieCount={@props.sortieCount}
        isHorizontal={@props.isHorizontal}
        enemyCount={@props.enemyCount}
        enemyFleet={@props.enemyFleet}
        enemyEscort={@props.enemyEscort}
        isFirst={0} />
      <ProphetContent
        mainFleet={@props.mainFleet}
        enemyFleet={@props.enemyFleet}
        enemyEscort={@props.enemyEscort}
        escortFleet={@props.escortFleet}
        destructionBattleFlag={@props.destructionBattleFlag}
        sortieCount={@props.sortieCount}
        isHorizontal={@props.isHorizontal}
        enemyCount={@props.enemyCount}
        isFirst={0}
        compactMode={@props.compactMode}/>
    </div>
