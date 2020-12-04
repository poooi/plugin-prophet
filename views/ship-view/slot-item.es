import React from 'react'
import { join } from 'path'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { withNamespaces } from 'react-i18next'
import { compose } from 'redux'
import { SlotitemIcon } from 'views/components/etc/icon'
import { equipIsAircraft } from 'views/utils/game-utils'
import styled from 'styled-components'

const { ROOT } = window

const Container = styled.div`
  white-space: nowrap;
  display: flex;
  align-items: center;
  width: 100%;
`

const ItemIcon = styled(SlotitemIcon)`
  &&&&& {
    width: 24px;
    height: 24px;
    border: none;
  }
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

// friend item is from _slotitems, while enemy item is from $slotitems
// so for enemy item, its $item will always be undefined
export const SlotItem = compose(
  withNamespaces('resources'),
  connect((state, props) => ({
    $item: get(state, `const.$equips.${(props.item || {}).api_slotitem_id}`),
  })),
)(({ item, extra, label, warn, $item, t }) => {
  if (!item) {
    return <div />
  }
  const data = {
    ...$item,
    ...item,
  }
  return (
    <Container>
      <span>
        <ItemIcon slotitemId={(data.api_type || [])[3]} />
        {label != null &&
          (extra || equipIsAircraft((data.api_type || [])[3])) && (
            <span className={`number ${warn ? 'text-warning' : ''}`}>
              {label}
            </span>
          )}
      </span>
      <ItemName>
        {/* use key separator because some item name contains `.` */}
        {t(data.api_name, {
          context: data.api_id && data.api_id.toString(),
          keySeparator: 'chiba',
        })}
      </ItemName>
      <span>
        <ALv className="alv">
          {data.api_alv >= 1 && data.api_alv <= 7 && (
            <ALvImage
              src={join(
                ROOT,
                'assets',
                'img',
                'airplane',
                `alv${data.api_alv}.png`,
              )}
              alt="alv"
            />
          )}
        </ALv>
        <span>{data.api_level > 0 ? `★${data.api_level}` : ''}</span>
      </span>
    </Container>
  )
})
