import React, { Component, PropTypes } from 'react'

// import { Models } from '../lib/battle'
// const { Formation, Engagement, AirControl } = Models

const __ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])

// Formation name map from api_search[0-1] to name
// 1=成功, 2=成功(未帰還機あり), 3=未帰還, 4=失敗, 5=成功(艦載機使用せず), 6=失敗(艦載機使用せず)
// const DetectionName = {
//   '1': __('Detection Success'),
//   '2': __('Detection Success') + ' (' + __('not return') + ')',
//   '3': __('Detection Failure') + ' (' + __('not return') + ')',
//   '4': __('Detection Failure'),
//   '5': __('Detection Success') + ' (' + __('without plane') + ')',
//   '6': __('Detection Failure') + ' (' + __('without plane') + ')',
// }

// Formation name map from api_formation[0-1] to name
// 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
// const FormationName = {
//   '1': __('Line Ahead'),
//   '2': __('Double Line'),
//   '3': __('Diamond'),
//   '4': __('Echelon'),
//   '5': __('Line Abreast'),
//   '11': __('Cruising Formation 1'),
//   '12': __('Cruising Formation 2'),
//   '13': __('Cruising Formation 3'),
//   '14': __('Cruising Formation 4'),
// }

// // Engagement name map from api_formation[2] to name
// // 1=同航戦, 2=反航戦, 3=T字戦有利, 4=T字戦不利
// const EngagementName = {
//   '1': __('Parallel Engagement'),
//   '2': __('Head-on Engagement'),
//   '3': __('Crossing the T (Advantage)'),
//   '4': __('Crossing the T (Disadvantage)'),
// }

// // Air Control name map from api_kouku.api_stage1.api_disp_seiku to name
// // 0=制空均衡, 1=制空権確保, 2=航空優勢, 3=航空劣勢, 4=制空権喪失
// const AirControlName = {
//   '0': __('Air Parity'),
//   '1': __('Air Supremacy'),
//   '2': __('Air Superiority'),
//   '3': __('Air Incapability'),
//   '4': __('Air Denial'),
// }

// // To remove
// const FormationMap = {
//   1: Formation.Ahead,
//   2: Formation.Double,
//   3: Formation.Diamond,
//   4: Formation.Echelon,
//   5: Formation.Abreast,
//   11: Formation.CruisingAntiSub,
//   12: Formation.CruisingForward,
//   13: Formation.CruisingDiamond,
//   14: Formation.CruisingBattle,
// }

// const EngagementMap = {
//   1: Engagement.Parallel,
//   2: Engagement.Headon,
//   3: Engagement.TAdvantage,
//   4: Engagement.TDisadvantage,
// }

// const AirControlMap = {
//   0: AirControl.Parity,
//   1: AirControl.Supremacy,
//   2: AirControl.Superiority,
//   3: AirControl.Incapability,
//   4: AirControl.Denial,
// }

// build a translation object, to map lib battle string-parsed API to prophet's translation
// it depends on the keys of kancolle API
// let translation = {}

// Object.keys(FormationMap).map(
//   key => translation[FormationMap[key]] = FormationName[key] || ''
// )

// Object.keys(EngagementMap).map(
//   key => translation[EngagementMap[key]] = EngagementName[key] || ''
// )

// Object.keys(AirControlMap).map(
//   key => translation[AirControlMap[key]] = AirControlName[key] || ''
// )


// console.log(translation)


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
        {`${result} | ${__(eFormation)} | ${__(battleForm)} | ${__(airControl) }`}
      </span>
    )
  }
}
