import React, { Component, PropTypes } from 'react'

import { _t } from '../utils'

export default class BattleInfo extends Component {
  static propTypes = {
    result: PropTypes.string.isRequired,
    eFormation: PropTypes.string.isRequired,
    battleForm: PropTypes.string.isRequired,
    airControl: PropTypes.string.isRequired,
  }

  static defaultProps = {
    result: '',
    eFormation: '',
    battleForm: '',
    airControl: '',
  }

  render() {
    const { result, eFormation, battleForm, airControl } = this.props
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
}
