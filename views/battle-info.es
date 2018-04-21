import React from 'react'
import PropTypes from 'prop-types'
import path from 'path'
import { translate } from 'react-i18next'

import { _t } from '../utils'

const BATTLE_RESULT = ['SS', 'S', 'A', 'B', 'C', 'D', 'E']

const BattleInfo = translate('poi-plugin-prophet')(({
  result = '', eFormation = '', battleForm = '', airControl = '', t,
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
        t(result)
      }
    </span>
    {'| '}
    {
      [_t(eFormation), _t(battleForm), _t(airControl)].filter(
        str => !!str
      ).join(' | ')
    }
  </span>
))


BattleInfo.propTypes = {
  result: PropTypes.string,
  eFormation: PropTypes.string,
  battleForm: PropTypes.string,
  airControl: PropTypes.string,
  t: PropTypes.func.isRequired,
}

export default BattleInfo
