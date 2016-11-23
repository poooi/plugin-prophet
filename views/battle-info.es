const __ = window.i18n["poi-plugin-prophet"].__.bind(window.i18n["poi-plugin-prophet"])

import {Panel} from 'react-bootstrap'
import React, { Component, PropTypes } from 'react'
import FontAwesome from 'react-fontawesome'

// Formation name map from api_search[0-1] to name
// 1=成功, 2=成功(未帰還機あり), 3=未帰還, 4=失敗, 5=成功(艦載機使用せず), 6=失敗(艦載機使用せず)
const DetectionName = {
  '1': __('Detection Success'),
  '2': __('Detection Success') + ' (' + __('not return') + ')',
  '3': __('Detection Failure') + ' (' + __('not return') + ')',
  '4': __('Detection Failure'),
  '5': __('Detection Success') + ' (' + __('without plane') + ')',
  '6': __('Detection Failure') + ' (' + __('without plane') + ')',
}

// Formation name map from api_formation[0-1] to name
// 1=単縦陣, 2=複縦陣, 3=輪形陣, 4=梯形陣, 5=単横陣, 11-14=第n警戒航行序列
export const FormationName = {
  '1': __('Line Ahead'),
  '2': __('Double Line'),
  '3': __('Diamond'),
  '4': __('Echelon'),
  '5': __('Line Abreast'),
  '11': __('Cruising Formation 1 (anti-sub)'),
  '12': __('Cruising Formation 2 (forward)'),
  '13': __('Cruising Formation 3 (ring)'),
  '14': __('Cruising Formation 4 (battle)'),
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
export const AirControlName = {
  '0': __('Air Parity'),
  '1': __('AS+'),
  '2': __('AS'),
  '3': __('Air Incapability'),
  '4': __('Air Denial'),
}


export default class BattleInfo extends Component {
  static propTypes = {
    result: PropTypes.string.isRequired,
    formation: PropTypes.number.isRequired,
    intercept: PropTypes.number.isRequired,
    seiku: PropTypes.number.isRequired,
  }

  static defaultProps = {
    result: '',
    formation: 0,
    intercept: 0,
    seiku: -1,
  }

  render(){
    const {result, formation, intercept, seiku} = this.props
    return <span>{`${result} | ${FormationName[formation] || ''} | ${EngagementName[intercept] || ''} | ${AirControlName[seiku] || '' }`}</span>
  }
}