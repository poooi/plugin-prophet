import React, { FC } from 'react'
import { Radio } from '@blueprintjs/core'
import { useSelector } from 'react-redux'
import { get, map } from 'lodash'
import styled from 'styled-components'
import { setConfig } from '../../host/poi-config'

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

interface RadioCheckProps {
  label: string
  configName: string
  default?: string
  options: RadioOption[]
}

const RadioCheck: FC<RadioCheckProps> = ({ label: displayName, configName, default: defaultVal = '0', options }) => {
  const current = useSelector((state: PoiRootState) => get(state.config, configName, defaultVal) as string)

  const handleClickRadio = (value: string) => () => {
    setConfig(configName, value)
  }

  return (
    <RadioContainer>
      <Name>
        <span>{displayName}</span>
      </Name>
      {map(options, ({ label, value }) => (
        <Radio
          key={value}
          style={{ marginRight: 10 }}
          onClick={handleClickRadio(value)}
          checked={value === current}
        >
          {label}
        </Radio>
      ))}
    </RadioContainer>
  )
}

export default RadioCheck
