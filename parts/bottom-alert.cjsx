{Panel} = ReactBootstrap
module.exports = React.createClass
  render: ->
    <div>
      {
        if @props.getShip? or @props.getItem?
          messages = []
          if @props.getItem?.api_useitem_id is 72
            messages.push "お飾り材料GET！"
          if @props.getShip?
            messages.push "#{window.i18n.resources.__ @props.getShip.api_ship_type} 「#{window.i18n.resources.__ @props.getShip.api_ship_name}」 #{@props.joinFleet}"
          <Panel>
            {messages.join " "}
          </Panel>
        else if @props.formationNum != 0
          <Panel>
            {"#{@props.result} | #{@props.formation} | #{@props.intercept} | #{@props.seiku}"}
          </Panel>
        else if @props.nextSpotInfo
          <Panel>
            {"#{@props.compassPoint}: "}
            <span className="compass">
            {
              if @props.compassAngle?
                # FontAwesome `location-arrow` points to north by east 45 degrees.
                <FontAwesome name='location-arrow' fixedWidth={true} className='compass-arrow'
                             style={transform: "rotate(#{@props.compassAngle - 45}deg)"} />
              else
                "?"
            }
            </span>
            {" | #{@props.nextSpot}: #{@props.nextSpotInfo}"}
          </Panel>
      }
    </div>
