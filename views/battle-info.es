import React, { Component, PropTypes } from 'react'
import path from 'path'

import { _t } from '../utils'

const { i18n } = window
const __ = i18n['poi-plugin-prophet'].__.bind(i18n['poi-plugin-prophet'])

const BATTLE_RESULT = ['SS', 'S', 'A', 'B', 'C', 'D', 'E']

const BattleInfo = ({ result = '', eFormation = '', battleForm = '', airControl = '' }) => {
  return (
    <span className="battle-info">
      <span className="param-icon">
        {
          BATTLE_RESULT.includes(result)
          ?
            <img
              src={path.resolve(__dirname, `../assets/icons/result-${result}.svg`)}
              className={`svg prophet-icon result-icon ${!window.isDarkTheme && 'light'}`}
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
}

// BattleInfo.propTypes = {
//   result: PropTypes.string.isRequired,
//   eFormation: PropTypes.string.isRequired,
//   battleForm: PropTypes.string.isRequired,
//   airControl: PropTypes.string.isRequired,
// }

export default BattleInfo
