import React from 'react'
import { connect } from 'react-redux'
import get from 'lodash/get'
import { Checkbox } from '@blueprintjs/core'
import styled from 'styled-components'
import type { PoiRootState } from '../../host/poi-types'

const Container = styled.div`
  padding-right: 2em;
`

interface CheckboxSettingOwnProps {
  label: string
  configName: string
  defaultVal?: boolean
}

interface CheckboxSettingStateProps {
  value: boolean
}

const CheckboxSettingInner: React.FC<CheckboxSettingOwnProps & CheckboxSettingStateProps> = ({
  label,
  configName,
  value,
}) => {
  const handleChange = () => {
    window.config.set(configName, !value)
  }

  return (
    <Container>
      <Checkbox checked={value} onChange={handleChange}>
        {label}
      </Checkbox>
    </Container>
  )
}

export const CheckboxSetting = connect(
  (state: PoiRootState, props: CheckboxSettingOwnProps): CheckboxSettingStateProps => ({
    value: get(state.config, props.configName, props.defaultVal ?? true) as boolean,
  }),
)(CheckboxSettingInner)
