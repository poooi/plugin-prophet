import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { resolvePluginPath } from '../../utils'

const ParameterImage = styled.img`
  width: 16px;
  height: 16px;
`

export const ParameterIcon = ({ name = '' }) => {
  const iconPath = resolvePluginPath(`./assets/icons/${name}.svg`)
  return (
    <span>
      <ParameterImage src={iconPath} alt={name} />
    </span>
  )
}

ParameterIcon.propTypes = {
  name: PropTypes.string,
}
