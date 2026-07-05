import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { SlotitemIcon } from '../../host/poi-ui'
import { resolveMainPath, resolvePluginPath } from '../../host/poi-assets'
import { getFullname } from '../../utils/ship-name'
import type { ShipViewModel, SlotItemViewModel } from '../../battle/battle-view-model'

// Re-export from host module for use in tooltip

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

const Container = styled.div`
  white-space: nowrap;
  display: flex;
  align-items: center;
  width: 100%;
`

const IconContainer = styled.span`
  position: relative;
`

const ItemIcon = styled(SlotitemIcon)`
  &&&&& {
    width: 24px;
    height: 24px;
    border: none;
  }
`

const IconLabel = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
`

const ItemName = styled.span`
  margin-left: 1rem;
  margin-right: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
`

const ALv = styled.span`
  display: inline-block;
`

const ALvImage = styled.img`
  width: 16px;
  height: 16px;
`

const ParameterImage = styled.img`
  width: 16px;
  height: 16px;
`

const BarContainer = styled.span`
  display: flex;
`

const MaterialIconImg = styled.img`
  height: 16px;
  width: 16px;
`

interface SlotItemViewProps {
  item: SlotItemViewModel | null
  label?: string
  warn?: boolean
}

const SlotItemView: React.FC<SlotItemViewProps> = ({ item, label }) => {
  const { t } = useTranslation('resources')
  if (!item) return <div />

  return (
    <Container>
      <IconContainer>
        <ItemIcon slotitemId={item.typeId} />
        {label && <IconLabel>{label}</IconLabel>}
      </IconContainer>
      <ItemName>
        {t(item.name, {
          context: item.id ? String(item.id) : undefined,
          keySeparator: 'chiba',
        })}
      </ItemName>
      <span>
        <ALv className="alv">
          {item.alv >= 1 && item.alv <= 7 && (
            <ALvImage
              src={resolveMainPath(`./assets/img/airplane/alv${item.alv}.png`)}
              alt="alv"
            />
          )}
        </ALv>
        <span>{item.level > 0 ? `★${item.level}` : ''}</span>
      </span>
    </Container>
  )
}

const paramNames: Array<{ key: keyof NonNullable<ShipViewModel['params']>; name: string }> = [
  { key: 'firepower', name: 'firepower' },
  { key: 'torpedo', name: 'torpedo' },
  { key: 'aa', name: 'AA' },
  { key: 'armor', name: 'armor' },
]

interface FuelBarProps {
  icon: number
  max: number
  now: number
}

const FuelBar: React.FC<FuelBarProps> = ({ icon, max, now }) => {
  const pcnt = max && now != null ? Math.round((100 * now) / max) : 100
  return (
    <BarContainer>
      <MaterialIconImg
        src={resolvePluginPath(`./assets/icons/material-${icon}.svg`)}
        alt={`material-${icon}`}
      />
      {`${pcnt}%`}
    </BarContainer>
  )
}

interface ShipTooltipProps {
  ship: ShipViewModel
  rawData?: {
    api_name?: string
    api_yomi?: string
    api_id?: number
    api_lv?: number
    api_fuel_max?: number
    api_fuel?: number
    api_bull_max?: number
    api_bull?: number
  }
}

export const ShipTooltip: React.FC<ShipTooltipProps> = ({ ship, rawData = {} }) => {
  const { t } = useTranslation('resources')

  const fullname = getFullname(t, rawData.api_name ?? ship.name, ship.yomi, rawData.api_id ?? ship.id)

  const params = ship.params

  return (
    <TooltipContainer>
      <ShipName>{fullname}</ShipName>
      <ShipEssential>
        {ship.owner !== 'Ours' && <span>ID {ship.id}</span>}
        <span>Lv. {rawData.api_lv ?? ship.level ?? '-'}</span>
        <span>
          <FuelBar icon={1} max={rawData.api_fuel_max ?? 0} now={rawData.api_fuel ?? 0} />
        </span>
        <span>
          <FuelBar icon={2} max={rawData.api_bull_max ?? 0} now={rawData.api_bull ?? 0} />
        </span>
      </ShipEssential>
      {params && (
        <ShipEssential>
          {paramNames.map(({ key, name }) => {
            const val = params[key]
            return typeof val !== 'undefined' ? (
              <span key={key}>
                <ParameterImage
                  src={resolvePluginPath(`./assets/icons/${name}.svg`)}
                  alt={name}
                />
                {val}
              </span>
            ) : null
          })}
        </ShipEssential>
      )}
      <SlotItems>
        {ship.slots.map((slot, i) => (
          <SlotItemView key={i} item={slot} />
        ))}
        {ship.extra && <SlotItemView item={ship.extra} label="+" />}
      </SlotItems>
    </TooltipContainer>
  )
}
