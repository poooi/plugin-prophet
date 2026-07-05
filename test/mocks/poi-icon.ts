// Mock for views/components/etc/icon
import React from 'react'

export const SlotitemIcon = ({ slotitemId, className }: { slotitemId?: number; className?: string }) => {
  return React.createElement('img', { 'data-slotitem-id': slotitemId, className })
}

export const MaterialIcon = ({ materialId, className }: { materialId?: number; className?: string }) => {
  return React.createElement('img', { 'data-material-id': materialId, className })
}
