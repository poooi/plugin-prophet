import React from 'react'
import PropTypes from 'prop-types'
import { withNamespaces } from 'react-i18next'
import styled, { css } from 'styled-components'

import { getTextWidth, getFullname } from './utils'
import { ShipNameContainer as BaseShipNameContainer } from '../common-styled'

const ShipNameContainer = styled(BaseShipNameContainer)`
  flex: 1;
  padding-top: 3px;
  font-size: 1.25em;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ half }) =>
    half &&
    css`
      font-size: 0.9em;
      margin-top: -0.5em;
    `}
`

export const ShipName = withNamespaces('resources')(
  ({ name, yomi, apiId, enemy, t }) => {
    const translated = t(name)
    const fullname = getFullname(t, name, yomi, apiId)
    const length = getTextWidth(fullname)
    if (translated === name || !enemy || length < 120) {
      return <ShipNameContainer>{fullname}</ShipNameContainer>
    }

    const parts = fullname.split(' ')
    const up = []
    const down = []

    let isUpFull = false
    while (parts.length) {
      const word = parts.shift()
      // 0.618: let's be golden
      if (
        getTextWidth([...up, word].join(' ')) <= length * 0.618 &&
        !isUpFull
      ) {
        up.push(word)
      } else {
        isUpFull = true
        down.push(word)
      }
    }

    return (
      <ShipNameContainer half>
        <span>{up.join(' ')}</span>
        <br />
        <span>{down.join(' ')}</span>
      </ShipNameContainer>
    )
  },
)

ShipName.propTypes = {
  name: PropTypes.string,
  yomi: PropTypes.string,
  apiId: PropTypes.number,
  enemy: PropTypes.bool,
}
