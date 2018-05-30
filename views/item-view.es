import React from 'react'
import { join } from 'path'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { translate } from 'react-i18next'
import { compose } from 'redux'
import { SlotitemIcon } from 'views/components/etc/icon'
import { equipIsAircraft } from 'views/utils/game-utils'

const { ROOT } = window

// friend item is from _slotitems, while enemy item is from $slotitems
// so for enemy item, its $item will always be undefined
const ItemView = compose(
  translate('resources'),
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
    <div className="item-info">
      <span className="item-icon">
        <SlotitemIcon
          slotitemId={(data.api_type || [])[3]}
          className="prophet-icon"
        />
        {label != null &&
        (extra || equipIsAircraft((data.api_type || [])[3])) ? (
          <span className={`number ${warn ? 'text-warning' : ''}`}>
            {label}
          </span>
        ) : null}
      </span>
      <span className="item-name">
        {/* use key separator because some item name contains `.` */}
        {t(data.api_name, { keySeparator: 'chiba' })}
      </span>
      <span className="item-attr">
        <span className="alv">
          {data.api_alv &&
            data.api_alv >= 1 &&
            data.api_alv <= 7 && (
              <img
                className="alv-img prophet-icon"
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
        </span>
        <span className="level">
          {data.api_level > 0 ? `★${data.api_level}` : ''}
        </span>
      </span>
    </div>
  )
})

export default ItemView
