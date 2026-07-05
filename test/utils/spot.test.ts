import { describe, it, expect } from 'vitest'
import { getSpotKind, getSpotMessage, spotInfo, spotIcon } from '../../src/utils/spot'

describe('getSpotKind', () => {
  it('returns api_event_id + 1 by default', () => {
    expect(getSpotKind(5, 0)).toBe(6) // Boss Battle
    expect(getSpotKind(2, 0)).toBe(3) // Obtain Resources
    expect(getSpotKind(3, 0)).toBe(4) // Lose Resources
  })

  it('returns 14 (Night Battle) for event_id=4, kind=2', () => {
    expect(getSpotKind(4, 2)).toBe(14)
  })

  it('returns 8 (Air Strike) for event_id=4, kind=4', () => {
    expect(getSpotKind(4, 4)).toBe(8)
  })

  it('returns 15 (Enemy Combined Fleet) for event_id=4, kind=5', () => {
    expect(getSpotKind(4, 5)).toBe(15)
  })

  it('returns 11 (Long Distance Aerial Battle) for event_id=4, kind=6', () => {
    expect(getSpotKind(4, 6)).toBe(11)
  })

  it('returns 7 (Battle Avoid from air) for event_id=6, kind=1', () => {
    expect(getSpotKind(6, 1)).toBe(7)
  })

  it('returns 12 (Manual Selection) for event_id=6, kind=2', () => {
    expect(getSpotKind(6, 2)).toBe(12)
  })

  it('returns 13 (Aerial Recon) for event_id=7, kind=0', () => {
    expect(getSpotKind(7, 0)).toBe(13)
  })

  it('returns 16 (Anchorage Repair) for event_id=10, kind=0', () => {
    expect(getSpotKind(10, 0)).toBe(16)
  })
})

describe('spotInfo', () => {
  it('maps spot kinds to display names', () => {
    expect(spotInfo[5]).toBe('Battle')
    expect(spotInfo[6]).toBe('Boss Battle')
    expect(spotInfo[14]).toBe('Night Battle')
    expect(spotInfo[0]).toBe('')
  })
})

describe('spotIcon', () => {
  it('maps spot names to icon values', () => {
    expect(spotIcon['Battle']).toBe('4-1')
    expect(spotIcon['Boss Battle']).toBe(5)
    expect(spotIcon['Obtain Resources']).toBe(2)
    expect(spotIcon['Air Strike']).toBe(7)
  })
})

describe('getSpotMessage', () => {
  it('returns empty string for non-message event IDs', () => {
    expect(getSpotMessage(5, 0)).toBe('')
    expect(getSpotMessage(4, 2)).toBe('')
  })

  it('returns message for event_id=1 (sortie events)', () => {
    const msg = getSpotMessage(1, 0)
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })

  it('returns message for event_id=6 with valid kind', () => {
    const msg = getSpotMessage(6, 3)
    expect(typeof msg).toBe('string')
  })

  it('returns empty string for unknown kind', () => {
    expect(getSpotMessage(1, 999)).toBe('')
  })
})
