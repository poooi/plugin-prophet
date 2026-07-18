import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { get } from 'lodash'
import { Checkbox } from '@blueprintjs/core'
import styled from 'styled-components'
import { setConfig } from '../../host/poi-config'

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
  const value = useSelector((state: PoiRootState) => get(state.config, configName, defaultVal) as boolean | undefined) ?? false

  const handleChange = () => {
    setConfig(configName, !value)
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
