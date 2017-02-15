import { getShipName } from '../utils'
import { join } from 'path'
import React, { Component } from 'react'
import { connect } from 'react-redux'
const { ROOT } = window
import { SlotitemIcon } from 'views/components/etc/icon'
import { get } from 'lodash'


export default connect((state, props) => ({
  $item: get(state, `const.$equips.${(props.item || {}).api_slotitem_id}`),
}))(class ItemView extends Component {
  render() {
    let {item, extra, label, warn, $item} = this.props
    if (! item) {
      return <div />
    }
    let raw = item
    let data = {
      ...$item,
      ...raw,
    }
    return (
        <div className='item-info'>
          <span className='item-icon'>
            <SlotitemIcon slotitemId={data.api_type[3]} className="prophet-icon"/>
            {
              label != null && (extra || [6, 7, 8, 9, 10, 21, 22, 33, 37, 38].includes(data.api_type[3])) ?
              <span className={`number ${warn ? 'text-warning' : ''}`}>{label}</span>
              : null
            }
          </span>
          <span className='item-name'>
            {`${getShipName(data)}`}
          </span>
          <span className='item-attr'>
            <span className="alv">
            {
              (data.api_alv && data.api_alv >= 1 && data.api_alv <= 7) &&
              <img className='alv-img prophet-icon'
                src={join(ROOT, 'assets', 'img', 'airplane', `alv${data.api_alv}.png`)}
              />
            }
            </span>
            <span className="level">{data.api_level > 0 ? `★${data.api_level}` : ''}</span>
          </span>
        </div>
    )
  }
})
