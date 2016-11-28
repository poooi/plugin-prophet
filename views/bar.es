import { getCondStyle, getHpStyle } from 'views/utils/game-utils'
import React from 'react'
import { ProgressBar } from 'react-bootstrap'
const { ROOT, $slotitems } = window
const { MaterialIcon, SlotitemIcon } = require(`${ROOT}/views/components/etc/icon`)

export class FABar extends React.Component {
  render() {
    let {max, now, icon} = this.props
    let pcnt = Math.round(100 * now / max)
    if (! (max && now)) {
      max = now = 0
      pcnt = 100
    }
    return (
      <span className='fa-bar prophet-icon'>
        <MaterialIcon materialId={icon} />
        {`${pcnt}%`}
      </span>
    )
  }
}

export class HPBar extends React.Component {
  getHpStyle(percent) {
    if (percent <= 25)
      return 'danger'
    else if (percent <= 50)
      return 'warning'
    else if (percent <= 75)
      return 'info'
    else
      return 'success'
  }



  render() {
    let {max, from, to, damage, stage, item, cond} = this.props
    from = Math.min(Math.max(0, from), max)
    to = Math.min(Math.max(0, to), max)
    if (stage == null) stage = from
    let now = 100 * to / max
    let lost = 100 * (stage - to) / max
    let additions = []

    if (Math.max(from - stage, 0) - damage !== 0) {
      additions.push(`${Math.max(from - stage, 0) - damage}`)
    }
    if (item && $slotitems[item]) {
      let itemIcon = $slotitems[item].api_type[3]
      additions.push(<SlotitemIcon slotitemId={itemIcon} />)
    }

    let labels = []
    labels.push(<span key={-1}>{`${to} / ${max}`}</span>)
    if (additions.length > 0) {
      labels.push(<span key={-2}>{' ('}</span>)
      additions.map((addition, i) => {
        labels.push(<span key={i*2+0}>{addition}</span>)
        labels.push(<span key={i*2+1}>{', '}</span>)
      })
      labels.pop()  // Remove last comma
      labels.push(<span key={-3}>{')'}</span>)
    }
    console.log(from, to, max, now, lost)

    return (
      <div>
        <div className="ship-stat">
          <div className="div-row">
            <span className="ship-hp">
              {labels}
            </span>
            {
              typeof cond !== 'undefined' ? <div className="status-cond">
                <span className={"ship-cond " + getCondStyle(cond)}>
                  ★{cond}
                </span>
              </div> : <noscript />
            }
          </div>
          <span className="hp-progress top-space">
            <ProgressBar className="hp-bar">
              <ProgressBar bsStyle={getHpStyle(now)}
                           className='hp-bar'
                           now={now} />
              <ProgressBar className='hp-bar lost'
                           now={lost} />
            </ProgressBar>
            {
              [1, 2, 3].map(i =>
                <div className='hp-indicatior' style={{left: `-${25 * i}%`, opacity: now + lost > 100 - 25 * i ? 0.8 : 0}}></div>
              )
            }
          </span>
        </div>
      </div>
    )
  }
}
