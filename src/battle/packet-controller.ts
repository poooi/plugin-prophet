import { first } from 'lodash'
import { BattleType, Simulator, type Battle } from 'poi-lib-battle'

import type { BattleDisplayState } from '../types'
import { synthesizeInfo } from '../utils/lib-battle-adapter'
import { SortieState } from '../utils/constants'

export const simulateBattleDisplayState = (battle: Battle): Partial<BattleDisplayState> => {
  const sortieState =
    battle.type === BattleType.Practice ? SortieState.Practice : SortieState.Battle
  const simulator = new Simulator(battle.fleet!, { usePoiAPI: true })
  const packets = battle.packet ?? []
  const firstPacket = packets[0] as { api_f_nowhps?: number[]; api_f_maxhps?: number[] } | undefined
  const nowHP = first(firstPacket?.api_f_nowhps)

  if (simulator.mainFleet?.[0] && simulator.mainFleet[0].nowHP !== nowHP && typeof nowHP !== 'undefined') {
    const maxHP = first(firstPacket?.api_f_maxhps)
    const flagship = simulator.mainFleet[0]
    flagship.useItem = maxHP === nowHP ? 43 : 42
    flagship.initHP = nowHP
    flagship.nowHP = nowHP
  }

  packets.forEach((packet) => simulator.simulate(packet))
  const { result } = simulator
  const newState = synthesizeInfo(simulator, result, packets as Record<string, unknown>[])

  return { ...newState, sortieState, result }
}
