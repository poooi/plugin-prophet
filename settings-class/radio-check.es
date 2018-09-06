import React, { Component } from 'react'
import propTypes from 'prop-types'
import { div } from 'react-bootstrap'
import { connect } from 'react-redux'
import { get, map } from 'lodash'

// single option check
// props:
//  configKey@String, key for identify the component
//  label@String, displayed label
//  options@Array[Object{key@Number, label@String}], possible strings
//  default@Number, default option, optional
const RadioCheck = connect((state, props) => ({
  value: get(state.config, props.configName, props.default || 0),
}))(
  class RadioCheck extends Component {
    static propTypes = {
      label: propTypes.string.isRequired,
      options: propTypes.objectOf(propTypes.string),
      value: propTypes.string.isRequired,
      configName: propTypes.string.isRequired,
    }

    handleClickRadio = value => () => {
      config.set(this.props.configName, value)
    }

    render() {
      const { label: displayName, options, value: current } = this.props
      return (
        <div
          style={{
            display: 'flex',
          }}
        >
          <div
            style={{
              paddingRight: '2em',
            }}
          >
            <span>{displayName}</span>
          </div>
          {map(options, ({ label, value }) => (
            <div
              key={value}
              role="button"
              tabIndex="0"
              onClick={this.handleClickRadio(value)}
              style={{
                backgroundColor: value === current && '#4caf50',
                border: '1px solid #fff',
                padding: '0 1em',
                marginRight: '-1px',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )
    }
  },
)

export default RadioCheck
