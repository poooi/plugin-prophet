import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { compact } from 'lodash'

import { _t, resolvePluginPath } from '../utils'
import { isPoiDarkTheme } from '../host/poi-assets'

const ResultIcon = styled.img<{ isLight?: boolean }>`
  width: 32px;
  height: 32px;
  margin-right: 0.5ex;
  ${({ isLight }) =>
    isLight &&
    css`
      background-color: #ccc;
      border-radius: 4px;
    `}
`

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;

  div + div {
    margin-left: 2rem;
  }

  div {
    display: flex;
    align-items: center;
  }
`

const BATTLE_RESULT = ['SS', 'S', 'A', 'B', 'C', 'D', 'E']

interface BattleInfoProps {
  result?: string
  eFormation?: string
  battleForm?: string
  airControl?: string
  smokeType?: number
}

const BattleInfo: FC<BattleInfoProps> = ({
  result = '',
  eFormation = '',
  battleForm = '',
  airControl = '',
  smokeType = 0,
}) => {
  const { t } = useTranslation('poi-plugin-prophet')
  return (
    <Container>
      <div>
        {BATTLE_RESULT.includes(result) ? (
          <ResultIcon
            src={resolvePluginPath(`./assets/icons/result-${result}.svg`)}
            isLight={!isPoiDarkTheme()}
            alt="result"
          />
        ) : (
          t(result)
        )}
      </div>

      {compact([
        _t(eFormation),
        _t(battleForm),
        _t(airControl),
        ...(smokeType ? [`${t('smoke')}: ${smokeType}`] : []),
      ]).map((text) => (
        <div key={text}>{text}</div>
      ))}
    </Container>
  )
}

export default BattleInfo
