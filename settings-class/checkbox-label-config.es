import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { get } from 'lodash'
import { Checkbox } from '@blueprintjs/core'

const CheckboxLabelConfig = connect((state, props) => ({
  value: get(state.config, props.configName, props.defaultVal),
  configName: props.configName,
  label: props.label,
}))(
  class checkboxLabelConfig extends Component {
    static propTypes = {
      label: PropTypes.string,
      configName: PropTypes.string,
      value: PropTypes.bool,
    }

    handleChange = () => {
      const { configName, value } = this.props
      config.set(configName, !value)
    }

    render() {
      const { value, label } = this.props
      return (
        <div
          style={{
            paddingRight: '2em',
          }}
        >
          <Checkbox checked={value} onChange={this.handleChange}>
            {label}
          </Checkbox>
        </div>
      )
    }
  },
)

export default CheckboxLabelConfig
