import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { getTextWidth, getFullname } from './utils'
import { ShipNameContainer as BaseShipNameContainer } from '../common-styled'

const ShipNameContainer = styled(BaseShipNameContainer)<{ half?: boolean }>`
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

interface ShipNameProps {
  name?: string
  yomi?: string
  apiId?: number
  enemy?: boolean
}

export const ShipName: FC<ShipNameProps> = ({ name = '', yomi = '', apiId = 0, enemy }) => {
  const { t } = useTranslation('resources')
  const translated = t(name)
  const fullname = getFullname(t, name, yomi, apiId)
  const length = getTextWidth(fullname)

  if (translated === name || !enemy || length < 120) {
    return <ShipNameContainer>{fullname}</ShipNameContainer>
  }

  const parts = fullname.split(' ')
  const up: string[] = []
  const down: string[] = []

  let isUpFull = false
  while (parts.length) {
    const word = parts.shift()!
    if (getTextWidth([...up, word].join(' ')) <= length * 0.618 && !isUpFull) {
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
}
