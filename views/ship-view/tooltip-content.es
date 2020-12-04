import React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

import ItemView from '../item-view'
import { FABar } from '../bar'
import { ParameterIcon } from './parameter-icon'
import { getFullname } from './utils'

const TooltipContainer = styled.div`
  min-width: 300px;
`

// fParam: [0]=火力, [1]=雷装, [2]=対空, [3]=装甲
const paramNames = ['firepower', 'torpedo', 'AA', 'armor']

export const TooltipContent = ({ data, ship, useFinalParam }) => {
  const param = (useFinalParam ? ship.finalParam : ship.baseParam) || []
  const { t } = useTranslation(['resources'])
  return (
    <TooltipContainer>
      <div className="ship-name">
        {getFullname(t, data.api_name, data.api_yomi, data.api_id)}
      </div>
      <div className="ship-essential">
        <span className="position-indicator">
          {ship.owner === 'Ours' ? '' : `ID ${ship.id}`}
        </span>
        <span>Lv. {data.api_lv || '-'}</span>

        <span>
          <FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} />
        </span>
        <span>
          <FABar icon={2} max={data.api_bull_max} now={data.api_bull} />
        </span>
      </div>
      <div className="ship-parameter">
        {paramNames.map(
          (name, idx) =>
            typeof param[idx] !== 'undefined' && (
              <span key={name}>
                <ParameterIcon name={name} />
                {param[idx]}
              </span>
            ),
        )}
      </div>

      {(data.poi_slot || []).map(
        (item, i) =>
          item && (
            <ItemView
              key={item.api_id}
              item={item}
              extra={false}
              warn={data.api_onslot[i] !== data.api_maxeq[i]}
            />
          ),
      )}

      <ItemView item={data.poi_slot_ex} extra label="+" warn={false} />
    </TooltipContainer>
  )
}

TooltipContent.propTypes = {
  data: PropTypes.shape({
    api_name: PropTypes.string,
    api_yomi: PropTypes.string,
    api_id: PropTypes.number,
    api_lv: PropTypes.number,
    poi_slot: PropTypes.array,
    api_onslot: PropTypes.array,
    api_maxeq: PropTypes.array,
    poi_slot_ex: PropTypes.object,
    api_fuel_max: PropTypes.number,
    api_fuel: PropTypes.number,
    api_bull_max: PropTypes.number,
    api_bull: PropTypes.number,
  }),
  ship: PropTypes.shape({
    owner: PropTypes.string,
    finalParam: PropTypes.array,
    baseParam: PropTypes.array,
    id: PropTypes.number,
  }),
  useFinalParam: PropTypes.bool,
}
