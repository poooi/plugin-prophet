import React from 'react'
import PropTypes from 'prop-types'
import path from 'path'

import { _t } from '../utils'

const { i18n } = window
const __ = i18n['poi-plugin-prophet'].__.bind(i18n['poi-plugin-prophet'])

const BATTLE_RESULT = ['SS', 'S', 'A', 'B', 'C', 'D', 'E']

const BattleInfo = ({
  result = '', eFormation = '', battleForm = '', airControl = '',
}) => (
  <span className="battle-info">
    <span className="param-icon">
      {
        BATTLE_RESULT.includes(result)
        ?
          <img
            src={path.resolve(__dirname, `../assets/icons/result-${result}.svg`)}
            className={`svg prophet-icon result-icon ${!window.isDarkTheme && 'light'}`}
            alt="result"
          />
        :
        __(result)
      }
    </span>
    {'| '}
    {
      [_t(eFormation), _t(battleForm), _t(airControl)].filter(
        str => !!str
      ).join(' | ')
    }
  </span>
)


BattleInfo.propTypes = {
  result: PropTypes.string,
  eFormation: PropTypes.string,
  battleForm: PropTypes.string,
  airControl: PropTypes.string,
}

export default BattleInfo
