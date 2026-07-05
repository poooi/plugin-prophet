// Mock for views/components/etc/avatar
import React from 'react'

export const Avatar = ({ mstId, height }: { mstId?: number; height?: number; isDamaged?: boolean }) => {
  return React.createElement('img', { 'data-mst-id': mstId, height })
}
