import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { get } from 'lodash'
import { Checkbox } from '@blueprintjs/core'
import styled from 'styled-components'

const CheckboxLabelConfigContainer = styled.div`
  padding-right: 2em;
`

interface CheckboxLabelConfigProps {
  label: string
  configName: string
  defaultVal?: boolean
}

const CheckboxLabelConfig: FC<CheckboxLabelConfigProps> = ({
  label,
  configName,
  defaultVal,
}) => {
  const value = useSelector((state: PoiRootState) => get(state.config, configName, defaultVal) as boolean | undefined)

  const handleChange = () => {
    config.set(configName, !value)
  }

  return (
    <CheckboxLabelConfigContainer>
      <Checkbox checked={value} onChange={handleChange}>
        {label}
      </Checkbox>
    </CheckboxLabelConfigContainer>
  )
}

export default CheckboxLabelConfig
