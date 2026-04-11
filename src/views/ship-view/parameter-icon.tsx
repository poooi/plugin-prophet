import React, { FC } from 'react'
import styled from 'styled-components'
import { resolvePluginPath } from '../../utils'

const ParameterImage = styled.img`
  width: 16px;
  height: 16px;
`

interface ParameterIconProps {
  name?: string
}

export const ParameterIcon: FC<ParameterIconProps> = ({ name = '' }) => {
  const iconPath = resolvePluginPath(`./assets/icons/${name}.svg`)
  return (
    <span>
      <ParameterImage src={iconPath} alt={name} />
    </span>
  )
}
