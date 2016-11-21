import {getShipName, getItemName} from './utils'
import FontAwesome from 'react-fontawesome'
import {join} from 'path'
import React, {Component} from 'react'
const { ROOT, $ships, $slotitems} = window
import {Panel, Grid, Row, Col, OverlayTrigger, Tooltip} from 'react-bootstrap'
import {SlotitemIcon} from 'views/components/etc/icon'
import {FABar, HPBar} from './bar'

import ItemView from './item-view'

const { i18n } = window
const __ = i18n["poi-plugin-prophet-testing"].__.bind(i18n["poi-plugin-prophet-testing"])

export default class LBACView extends React.Component {
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
        {corps.api_plane_info.map((plane, i) =>
          <ItemView key={i} item={plane.poi_slot} extra={false} label={plane.api_count}
            warn={plane.api_count !== plane.api_max_count} />
        )}
        </Col>
      </Grid>
    )
  }
}