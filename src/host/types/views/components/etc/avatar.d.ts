import type React from 'react'

interface AvatarProps {
  mstId: number
  height?: number
  isDamaged?: boolean
  [key: string]: unknown
}

export declare const Avatar: React.ComponentType<AvatarProps>
