import React from 'react'
import PropTypes from 'prop-types'
import { resolve } from 'path'
import styled from 'styled-components'

const ParameterImage = styled.img`
  width: 16px;
  height: 16px;
`

export const ParameterIcon = ({ name = '' }) => {
  const iconPath = resolve(__dirname, `../../../assets/icons/${name}.svg`)
  return (
    <span>
      <ParameterImage src={iconPath} alt={name} />
    </span>
  )
}

ParameterIcon.propTypes = {
  name: PropTypes.string,
}
