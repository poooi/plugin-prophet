import React, { Component, PropTypes } from 'react'

import { Models } from '../lib/battle'
const { Formation, Engagement, AirControl } = Models

const __ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])


// Formation name map from api_formation[0-1] to name
// 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
const FormationName = {
  [Formation.Ahead  ]: __('Line Ahead'),
  [Formation.Double ]: __('Double Line'),
  [Formation.Diamond]: __('Diamond'),
  [Formation.Echelon]: __('Echelon'),
  [Formation.Abreast]: __('Line Abreast'),
  [Formation.CruisingAntiSub]: __('Cruising Formation 1'),
  [Formation.CruisingForward]: __('Cruising Formation 2'),
  [Formation.CruisingDiamond]: __('Cruising Formation 3'),
  [Formation.CruisingBattle ]: __('Cruising Formation 4'),
}

// Engagement name map from api_formation[2] to name
// 1=同航戦, 2=反航戦, 3=T字戦有利, 4=T字戦不利
const EngagementName = {
  [Engagement.Parallel     ]: __('Parallel Engagement'),
  [Engagement.Headon       ]: __('Head-on Engagement'),
  [Engagement.TAdvantage   ]: __('Crossing the T (Advantage)'),
  [Engagement.TDisadvantage]: __('Crossing the T (Disadvantage)'),
}

// Air Control name map from api_kouku.api_stage1.api_disp_seiku to name
// 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
const AirControlName = {
  [AirControl.Parity      ]: __('Air Parity'),
  [AirControl.Supremacy   ]: __('Air Supremacy'),
  [AirControl.Superiority ]: __('Air Superiority'),
  [AirControl.Incapability]: __('Air Incapability'),
  [AirControl.Denial      ]: __('Air Denial'),
}



// build a translation object, to map lib battle string-parsed API to prophet's translation
// it requires that there's no duplicated keys
// if lib battle returns API number, then the translation should be done separately
const translation = {
  ...FormationName,
  ...EngagementName,
  ...AirControlName,
}

const _t = (str) => translation[str] || str

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

  render(){
    const {result, eFormation, battleForm, airControl} = this.props
    return (
      <span className='battle-info'>
        {
          [result, _t(eFormation), _t(battleForm), _t(airControl)].filter(
            str => !!str
          ).join(' | ')
        }
      </span>
    )
  }
}
