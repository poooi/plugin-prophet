import { describe, expect, it } from 'vitest'

import { getAutoLayout } from './layout'

describe('getAutoLayout', () => {
  it('uses horizontal layout when vertical space is limited', () => {
    expect(getAutoLayout(400, 299)).toBe('horizontal')
  })

  it('uses horizontal layout when width is much larger than height', () => {
    expect(getAutoLayout(1000, 500)).toBe('horizontal')
  })

  it('uses vertical layout when height is sufficient', () => {
    expect(getAutoLayout(400, 500)).toBe('vertical')
  })
})
