{Table, ProgressBar, Grid, Input, Col, Button, Panel} = ReactBootstrap
module.exports = React.createClass
  render: ->
    if @props.isFirst == 1 || (@props.isFirst == 0 && @props.lay == 0)
      if @props.isFirst == 1
        <Panel>
          {
            list = []
            tmp = 6 / (@props.cols + 1)
            k = 0
            for i in [0..(@props.cols)]
              if (i == @props.cols) && (@props.lay == 1)
                if !@props.enemyPlane
                  list.push <Col key={++k} xs={tmp}>{@props.enemyName}</Col>
                else
                  list.push <Col key={++k} xs={tmp} className="navigation-bar-airplane">「<FontAwesome name='plane' />{@props.enemyPlane}」</Col>
              else if i == 1 or !@props.sortiePlane
                list.push <Col key={++k} xs={tmp}>{@props.sortieFleet}</Col>
              else
                list.push <Col key={++k} xs={tmp} className="navigation-bar-airplane">「<FontAwesome name='plane' />{@props.sortiePlane}」</Col>
              list.push <Col key={++k} xs={tmp}>{@props.HP}</Col>
            <Grid>
              {list}
            </Grid>
          }
        </Panel>
      else if @props.enemyFleet.ship[0].id != -1
        <Panel>
          <Grid>
            <Col xs={6} className="navigation-bar-airplane">
              {
                if @props.enemyPlane
                  <span>「<FontAwesome name='plane' />{@props.enemyPlane}」</span>
              }
              {@props.enemyName}
            </Col>
            <Col xs={6}>{@props.HP}</Col>
          </Grid>
        </Panel>
      else
        <div></div>
    else
      <div></div>
