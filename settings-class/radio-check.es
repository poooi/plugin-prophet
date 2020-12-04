import React, { Component } from 'react'
import propTypes from 'prop-types'
import { Radio } from '@blueprintjs/core'
import { connect } from 'react-redux'
import { get, map } from 'lodash'
import styled from 'styled-components'

const RadioContainer = styled.div`
  display: flex;
`

const Name = styled.div`
  padding-right: 2em;
`

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

    handleClickRadio = (value) => () => {
      const { configName } = this.props
      config.set(configName, value)
    }

    render() {
      const { label: displayName, options, value: current } = this.props
      return (
        <RadioContainer>
          <Name>
            <span>{displayName}</span>
          </Name>
          {map(options, ({ label, value }) => (
            <Radio
              key={value}
              style={{ marginRight: 10 }}
              onClick={this.handleClickRadio(value)}
              checked={value === current}
            >
              {label}
            </Radio>
          ))}
        </RadioContainer>
      )
    }
  },
)

export default RadioCheck
