import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { SlotitemIcon } from 'views/components/etc/icon'
import styled from 'styled-components'

import { resolveMainPath } from '../../utils'

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

const ItemName = styled.span<{ warn?: boolean }>`
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

interface SlotItemProps {
  item?: ApiSlotItemLike | null
  label?: string
  extra?: boolean
  warn?: boolean
}

export const SlotItem: FC<SlotItemProps> = ({ item, label, warn }) => {
  const { t } = useTranslation('resources')
  const $item = useSelector((state: PoiRootState) =>
    state.const?.$equips?.[item?.api_slotitem_id ?? -1],
  )

  if (!item) return <div />

  const data = { ...$item, ...item }

  return (
    <Container>
      <IconContainer>
        <ItemIcon slotitemId={(data.api_type || [])[3]} />
        {label && <IconLabel>{label}</IconLabel>}
      </IconContainer>
      <ItemName warn={warn}>
        {t(data.api_name, {
          context: data.api_id && data.api_id.toString(),
          keySeparator: 'chiba',
        })}
      </ItemName>
      <span>
        <ALv className="alv">
          {(data.api_alv ?? 0) >= 1 && (data.api_alv ?? 0) <= 7 && (
            <ALvImage
              src={resolveMainPath(`./assets/img/airplane/alv${data.api_alv}.png`)}
              alt="alv"
            />
          )}
        </ALv>
        <span>{(data.api_level ?? 0) > 0 ? `★${data.api_level}` : ''}</span>
      </span>
    </Container>
  )
}
