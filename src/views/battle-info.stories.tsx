import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import BattleInfo from './battle-info'

void React

const meta = {
  title: 'Prophet/Battle Info',
  component: BattleInfo,
  args: {
    result: 'S',
    eFormation: 'Line Ahead',
    battleForm: 'Parallel Engagement',
    airControl: 'Air Superiority',
    smokeType: 0,
  },
} satisfies Meta<typeof BattleInfo>

export default meta

type Story = StoryObj<typeof meta>

export const BattleResult: Story = {}

export const SmokeBattle: Story = {
  args: {
    result: 'A',
    smokeType: 2,
  },
}

export const UnknownResultText: Story = {
  args: {
    result: 'Enemy Vessel',
    eFormation: '',
    battleForm: '',
    airControl: '',
  },
}
