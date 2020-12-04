import React from 'react'
import PropTypes from 'prop-types'
import path from 'path'
import { withNamespaces } from 'react-i18next'
import styled, { css } from 'styled-components'

import { _t } from '../utils'

const ResultIcon = styled.img`
  width: 20px;
  margin-right: 0.5ex;
  ${({ isLight }) =>
    isLight &&
    css`
      background-color: #ccc;
      border-radius: 5px;
    `}
`

const BATTLE_RESULT = ['SS', 'S', 'A', 'B', 'C', 'D', 'E']

const BattleInfo = withNamespaces('poi-plugin-prophet')(
  ({ result = '', eFormation = '', battleForm = '', airControl = '', t }) => (
    <span className="battle-info">
      <span className="param-icon">
        {BATTLE_RESULT.includes(result) ? (
          <ResultIcon
            src={path.resolve(
              __dirname,
              `../assets/icons/result-${result}.svg`,
            )}
            isLight={!window.isDarkTheme}
            alt="result"
          />
        ) : (
          t(result)
        )}
      </span>
      {'| '}
      {[_t(eFormation), _t(battleForm), _t(airControl)]
        .filter((str) => !!str)
        .join(' | ')}
    </span>
  ),
)

BattleInfo.propTypes = {
  result: PropTypes.string,
  eFormation: PropTypes.string,
  battleForm: PropTypes.string,
  airControl: PropTypes.string,
  t: PropTypes.func.isRequired,
}

export default BattleInfo
