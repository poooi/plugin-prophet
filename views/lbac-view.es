import { getItemName} from './utils'
import React, {Component} from 'react'
import { Grid, Row, Col} from 'react-bootstrap'
import ItemView from './item-view'



export default class LBACView extends Component {
  render() {
    let {child: corps} = this.props
    if (! (corps && corps.api_plane_info)) {
      return <div />
    }
    return (
      <Grid className="lbac-view">
        <Col xs={5}>
          <Row className='lbac-name'>
            <span>{getItemName(corps)}</span>
            <span className="position-indicator">{`(No.${corps.api_rid})`}</span>
          </Row>
        </Col>
        <Col xs={7}>
        {
          corps.api_plane_info.map((plane, i) =>
            <ItemView key={i} item={plane.poi_slot} extra={false} label={plane.api_count}
              warn={plane.api_count !== plane.api_max_count} />
          )
        }
        </Col>
      </Grid>
    )
  }
}
