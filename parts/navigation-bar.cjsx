module.exports = React.createClass
  render: ->
    list = []
    if @props.isFirst == 1
      if !@props.sortiePlane
        list.push <span className="navigator-item">{@props.sortieFleet}</span>
      else
        list.push <span className="navigator-item">「<FontAwesome name='plane' />{@props.sortiePlane}」</span>
      list.push <span className="navigator-item">{@props.HP}</span>
      if @props.sortieCount > 1
        list.push <span className="navigator-item">{@props.sortieFleet}</span>
        list.push <span className="navigator-item">{@props.HP}</span>
      if @props.isHorizontal != 0
        if !@props.enemyPlane
          list.push <span className="navigator-item">{@props.enemyName}</span>
        else
          list.push <span className="navigator-item">「<FontAwesome name='plane' />{@props.enemyPlane}」</span>
        list.push <span className="navigator-item">{@props.HP}</span>
        if @props.enemyCount > 1
          list.push <span className="navigator-item">{@props.enemyName}</span>
          list.push <span className="navigator-item">{@props.HP}</span>
    else if @props.enemyFleet.ship[0].id != -1 && @props.isHorizontal == 0
      if !@props.enemyPlane
        list.push <span className="navigator-item">{@props.enemyName}</span>
      else
        list.push <span className="navigator-item">「<FontAwesome name='plane' />{@props.enemyPlane}」</span>
      list.push <span className="navigator-item">{@props.HP}</span>
      if @props.enemyCount > 1
        list.push <span className="navigator-item">{@props.enemyName}</span>
        list.push <span className="navigator-item">{@props.HP}</span>
    <div className="navigator-bar">{list}</div>
