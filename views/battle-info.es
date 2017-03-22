import React, { Component, PropTypes } from 'react'
import path from 'path'

import { _t } from '../utils'

const BattleInfo = ({ result = '', eFormation = '', battleForm = '', airControl = '' }) => {
  const iconPath = path.resolve(__dirname, `../assets/icons/result-${result}.svg`)
  return (
    <span className="battle-info">
      <span className="param-icon"><img src={iconPath} className="svg prophet-icon result-icon" /></span>
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
