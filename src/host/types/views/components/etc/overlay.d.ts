import type React from 'react'

interface TooltipProps {
  content: React.ReactNode
  position?: string
  wrapperTagName?: string
  targetTagName?: string
  children?: React.ReactNode
  [key: string]: unknown
}

export declare const Tooltip: React.ComponentType<TooltipProps>
