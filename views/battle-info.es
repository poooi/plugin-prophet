import React, { Component, PropTypes } from 'react'

import { _t } from '../utils'

const BattleInfo = ({ result = '', eFormation = '', battleForm = '', airControl = '' }) => {
  return (
    <span className="battle-info">
      {
        [result, _t(eFormation), _t(battleForm), _t(airControl)].filter(
          str => !!str
        ).join(' | ')
      }
    </span>
  )
}

BattleInfo.propTypes = {
  result: PropTypes.string.isRequired,
  eFormation: PropTypes.string.isRequired,
  battleForm: PropTypes.string.isRequired,
  airControl: PropTypes.string.isRequired,
}

export default BattleInfo
