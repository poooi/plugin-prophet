{OverlayTrigger, Tooltip} = ReactBootstrap
path = require 'path-extra'

{SlotitemIcon} = require(path.join(ROOT, 'views', 'components', 'etc', 'icon'))

getCondStyle = (cond, show) ->
  if show
    window.getCondStyle cond

Slotitems = React.createClass
  shouldComponentUpdate: (nextProps, nextState) ->
    not _.isEqual nextProps, @props
  render: ->
    <div className="slotitems-mini" style={display: "flex", flexFlow: "column"}>
    {
      for itemId, i in @props.slot
        continue if itemId == -1
        if @props.owner == 1
          item = window.$slotitems[itemId]
        else
          item = window._slotitems[itemId]
        item ?= 
          api_type: []
          api_name: '???'
          api_level: 0
        itemType = item?.api_type?[3]
        kiraValue = item.api_level ? item.api_level : 0
        <div key={i} className="slotitem-container-mini">
          {
            if itemType?
              <SlotitemIcon key={itemId} className='slotitem-img' slotitemId={itemType} />
          }
          <span className="slotitem-name-mini">
            {window.i18n.resources.__ item.api_name}
              {if @props.owner != 1 then <strong style={color: '#45A9A5'}> ★{kiraValue}</strong> else ''}
              &nbsp;&nbsp;{
                if item.api_alv? and 1 <= item.api_alv <= 7
                  <img className='alv-img' src={path.join(ROOT, 'assets', 'img', 'airplane', "alv#{item.api_alv}.png")} />
                else ''
              }
          </span>
        </div>
    }
    </div>

module.exports = React.createClass
  render: ->
    if @props.ship.id == -1
      <td>　</td>
    else
      nameText = "#{@props.ship.name} "
      showCond = @props.condShow
      nameText += "★#{@props.ship.cond} " if showCond
      nameText += "- Lv.#{@props.ship.lv} " if !@props.compactMode

      <td style={opacity: 1 - 0.6 * @props.ship.back} className="prophet-info-content">
        <div className="ship-title">
          <OverlayTrigger placement='left' overlay={
            <Tooltip id="ship-pop-#{@props.ship.id}" className="ship-pop">
              <div className="item-name">
                <Slotitems slot={@props.ship.slot} owner={@props.ship.owner}/>
              </div>
            </Tooltip>
          }>
            <div className="ship-name">
              <span className={getCondStyle(@props.ship.cond, showCond)}>
                <span className="prophet-info-name">{nameText}</span>
              </span>
            </div>
          </OverlayTrigger>
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
