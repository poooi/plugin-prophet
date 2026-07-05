import type React from 'react'

interface SlotitemIconProps {
  slotitemId: number
  className?: string
  [key: string]: unknown
}

interface MaterialIconProps {
  materialId: number
  className?: string
  [key: string]: unknown
}

export declare const SlotitemIcon: React.ComponentType<SlotitemIconProps>
export declare const MaterialIcon: React.ComponentType<MaterialIconProps>
