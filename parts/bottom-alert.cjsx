__ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])

{Panel} = ReactBootstrap
module.exports = React.createClass
  render: ->
    <div className="bottom-alert">
      {
        if @props.getShip? or @props.getItem?
          messages = []
          if @props.getItem?
            messages.push __ "Item get", window.i18n.resources.__(@props.getItem)
          if @props.getShip?
            messages.push __ "Join fleet",
                window.i18n.resources.__(@props.getShip.api_ship_type),
                window.i18n.resources.__(@props.getShip.api_ship_name)
          <span>
            {messages.join " "}
          </span>
        else if @props.formationNum != 0
          <span>
            {"#{@props.result} | #{@props.formation} | #{@props.intercept} | #{@props.seiku}"}
          </span>
        else if @props.nextSpotInfo
          <span>
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
          </span>
      }
    </div>
