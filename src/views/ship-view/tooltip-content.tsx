import React, { FC } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import type { Ship } from 'poi-lib-battle'

import { SlotItem } from './slot-item'
import { FABar } from '../bar'
import { ParameterIcon } from './parameter-icon'
import { getFullname } from './utils'
import type { FriendShipRaw } from './types'

const TooltipContainer = styled.div``

const ShipName = styled.div`
  font-size: 1.5rem;
`
const ShipEssential = styled.div`
  display: flex;
  align-items: center;

  > span + span {
    margin-left: 1rem;
  }
`

const SlotItems = styled.div`
  margin-left: -4px;
  margin-top: 1rem;
`

const paramNames = ['firepower', 'torpedo', 'AA', 'armor']

interface TooltipContentProps {
  data: FriendShipRaw
  ship: Ship
  useFinalParam?: boolean
}

export const TooltipContent: FC<TooltipContentProps> = ({ data, ship, useFinalParam }) => {
  const param: number[] = (useFinalParam ? ship.finalParam : ship.baseParam) || []
  const { t } = useTranslation('resources')
  return (
    <TooltipContainer>
      <ShipName>
        {getFullname(t, data.api_name, data.api_yomi, data.api_id)}
      </ShipName>
      <ShipEssential>
        {ship.owner !== 'Ours' && <span>ID {ship.id}</span>}
        <span>Lv. {data.api_lv || '-'}</span>
        <span>
          <FABar icon={1} max={data.api_fuel_max} now={data.api_fuel} />
        </span>
        <span>
          <FABar icon={2} max={data.api_bull_max} now={data.api_bull} />
        </span>
      </ShipEssential>
      <ShipEssential>
        {paramNames.map(
          (name, idx) =>
            typeof param[idx] !== 'undefined' && (
              <span key={name}>
                <ParameterIcon name={name} />
                {param[idx]}
              </span>
            ),
        )}
      </ShipEssential>
      <SlotItems>
        {(data.poi_slot || []).map(
          (item: ApiSlotItemLike | null, i: number) =>
            item && (
              <SlotItem
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                item={item}
                extra={false}
              />
            ),
        )}
        <SlotItem item={data.poi_slot_ex} extra label="+" />
      </SlotItems>
    </TooltipContainer>
  )
}
