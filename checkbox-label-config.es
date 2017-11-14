import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { get } from 'lodash'
import { Row, Col, Grid, Checkbox } from 'react-bootstrap'

const CheckboxLabelConfig = connect(
  (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    undecided: props.undecided,
    label: props.label,
  })
)(class checkboxLabelConfig extends Component {
  static propTypes = {
    label: PropTypes.string,
    configName: PropTypes.string,
    value: PropTypes.bool,
    undecided: PropTypes.bool,
  }
  handleChange = () => {
    config.set(this.props.configName, !this.props.value)
  }
  render() {
    return (
      <Row className={this.props.undecided ? 'undecided-checkbox-inside' : ''} >
        <Col xs={12} >
          <Grid>
            <Col xs={12} >
              <Checkbox
                disabled={this.props.undecided}
                checked={this.props.undecided ? false : this.props.value}
                onChange={this.props.undecided ? null : this.handleChange}
              >
                {this.props.label}
              </Checkbox>
            </Col>
          </Grid>
        </Col>
      </Row>
    )
  }
})

export default CheckboxLabelConfig
