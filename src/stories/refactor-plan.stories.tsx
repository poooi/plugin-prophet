import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

const RefactorPlanStory = () => (
  <div style={{ padding: 16 }}>
    <h1>Prophet component workbench</h1>
    <p>Storybook is configured; component-specific stories should be added as components are refactored.</p>
  </div>
)

const meta = {
  title: 'Prophet/Refactor Plan',
  component: RefactorPlanStory,
} satisfies Meta<typeof RefactorPlanStory>

export default meta

type Story = StoryObj<typeof meta>

export const WorkbenchReady: Story = {}
