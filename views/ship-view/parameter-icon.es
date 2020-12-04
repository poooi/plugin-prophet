import React from 'react'
import PropTypes from 'prop-types'
import { resolve } from 'path'

export const ParameterIcon = ({ name = '' }) => {
  const iconPath = resolve(__dirname, `../../assets/icons/${name}.svg`)
  return (
    <span className="param-icon">
      <img src={iconPath} className="svg prophet-icon" alt={name} />
    </span>
  )
}

ParameterIcon.propTypes = {
  name: PropTypes.string,
}
