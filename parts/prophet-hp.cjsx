{Table, ProgressBar, Grid, Input, Col, Alert, Button} = ReactBootstrap

getHpStyle = (percent) ->
  if percent <= 25
    'danger'
  else if percent <= 50
    'warning'
  else if percent <= 75
    'info'
  else
    'success'

getLineStyle = (isFriend) ->
  if isFriend > 0
    'friend-hp'
  else
    'enemy-hp'

module.exports = React.createClass
  render: ->
    if @props.lv == -1
      <td>　</td>
    else
      <td className="hp-progress" style={opacity: 1 - 0.6 * @props.isBack}>
        <div className={getLineStyle @props.isFriend && (@props.now * 4 - @props.max > 0)}>
          <ProgressBar bsStyle={getHpStyle @props.now / @props.max * 100}
            now={@props.now / @props.max * 100}
            label={if @props.dmg > 0 then "#{@props.now} / #{@props.max} (-#{@props.dmg})" else "#{@props.now} / #{@props.max}"} />
        </div>
      </td>
