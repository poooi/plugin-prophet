import React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import { Radio } from '@blueprintjs/core'
import map from 'lodash/map'
import styled from 'styled-components'
import type { PoiRootState } from '../../host/poi-types'

const RadioContainer = styled.div`
  display: flex;
`

const Name = styled.div`
  padding-right: 2em;
`

interface RadioOption {
  label: string
  value: string
}

interface RadioSettingOwnProps {
  label: string
  configName: string
  default?: string
  options: RadioOption[]
}

interface RadioSettingStateProps {
  value: string
}

const RadioSettingInner: React.FC<RadioSettingOwnProps & RadioSettingStateProps> = ({
  label,
  configName,
  options,
  value: current,
}) => {
  const handleClick = (val: string) => () => {
    window.config.set(configName, val)
  }

  return (
    <RadioContainer>
      <Name>
        <span>{label}</span>
      </Name>
      {map(options, ({ label: optLabel, value }) => (
        <Radio
          key={value}
          style={{ marginRight: 10 }}
          onClick={handleClick(value)}
          checked={value === current}
          onChange={() => undefined}
        >
          {optLabel}
        </Radio>
      ))}
    </RadioContainer>
  )
}

export const RadioSetting = connect(
  (state: PoiRootState, props: RadioSettingOwnProps): RadioSettingStateProps => ({
    value: get(state.config, props.configName, props.default ?? '') as string,
  }),
)(RadioSettingInner)
