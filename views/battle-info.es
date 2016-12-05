import React, { Component, PropTypes } from 'react'

import { Models } from '../lib/battle'
const { FormationMap, EngagementMap, AirControlMap } = Models

const __ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])


// Formation name map from api_formation[0-1] to name
// 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
const FormationName = {
  '1': __('Line Ahead'),
  '2': __('Double Line'),
  '3': __('Diamond'),
  '4': __('Echelon'),
  '5': __('Line Abreast'),
  '11': __('Cruising Formation 1'),
  '12': __('Cruising Formation 2'),
  '13': __('Cruising Formation 3'),
  '14': __('Cruising Formation 4'),
}

// Engagement name map from api_formation[2] to name
// 1=同航戦, 2=反航戦, 3=T字戦有利, 4=T字戦不利
const EngagementName = {
  '1': __('Parallel Engagement'),
  '2': __('Head-on Engagement'),
  '3': __('Crossing the T (Advantage)'),
  '4': __('Crossing the T (Disadvantage)'),
}

// Air Control name map from api_kouku.api_stage1.api_disp_seiku to name
// 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
const AirControlName = {
  '0': __('Air Parity'),
  '1': __('Air Supremacy'),
  '2': __('Air Superiority'),
  '3': __('Air Incapability'),
  '4': __('Air Denial'),
}



// build a translation object, to map lib battle string-parsed API to prophet's translation
// it depends on the keys from kancolle API response
// if lib battle returns API number, then simply use Names above
let translation = {}

Object.keys(FormationMap).map(
  key => translation[FormationMap[key]] = FormationName[key] || ''
)

Object.keys(EngagementMap).map(
  key => translation[EngagementMap[key]] = EngagementName[key] || ''
)

Object.keys(AirControlMap).map(
  key => translation[AirControlMap[key]] = AirControlName[key] || ''
)

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
        {`${result} | ${_t(eFormation)} | ${_t(battleForm)} | ${_t(airControl) }`}
      </span>
    )
  }
}
