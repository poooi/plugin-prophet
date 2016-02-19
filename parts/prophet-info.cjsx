{Table, ProgressBar, Grid, Input, Col, Alert, Button, OverlayTrigger, Popover} = ReactBootstrap

getCondStyle = (cond, show) ->
  if show
    window.getCondStyle cond

module.exports = React.createClass
  render: ->
    if @props.lv == -1
      <td>　</td>
    else
      nameText = "#{@props.ship.name} "
      showCond = @props.condShow
      nameText += "★#{@props.ship.cond} " if showCond
      nameText += "- Lv.#{@props.ship.lv} " if !@props.compactMode

      <td style={opacity: 1 - 0.6 * @props.isBack} className="prophet-info-content">
        <div className="ship-name">
          <span className={getCondStyle(@props.ship.cond, showCond)}>
            <span className="prophet-info-name">{nameText}</span>
          </span>
        </div>
        <div className="attack-damage">
          {
            if @props.mvp == true
              <span className={getCondStyle(100, 1)}>{@props.ship.hp.damage}</span>
            else
              <span>{@props.ship.hp.damage}</span>
          }
        </div>
      </td>
