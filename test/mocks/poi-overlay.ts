// Mock for views/components/etc/overlay
import React from 'react'

export const Tooltip = ({ children }: { children: React.ReactNode; content?: React.ReactNode; position?: string; wrapperTagName?: string; targetTagName?: string }) => {
  return React.createElement(React.Fragment, null, children)
}
