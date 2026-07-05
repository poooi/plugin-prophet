import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { loadCache, getCache, setCachePath, saveCache, LS_PATH } from '../../src/state/storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset cache to clean state by loading with safeMode=true
    loadCache(true)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('loadCache', () => {
    it('returns empty object in safe mode', () => {
      const cache = loadCache(true)
      expect(cache).toEqual({})
    })

    it('returns empty object when localStorage has no entry', () => {
      const cache = loadCache(false)
      expect(cache).toEqual({})
    })

    it('loads existing cache from localStorage', () => {
      const stored = { history: { '1-1-3': { fFormation: 'Line Ahead' } } }
      localStorage.setItem(LS_PATH, JSON.stringify(stored))
      const cache = loadCache(false)
      expect(cache).toEqual(stored)
    })

    it('returns empty object when localStorage has invalid JSON', () => {
      localStorage.setItem(LS_PATH, 'invalid json {{{')
      const cache = loadCache(false)
      expect(cache).toEqual({})
    })
  })

  describe('getCache', () => {
    it('returns current cache', () => {
      loadCache(true)
      expect(getCache()).toEqual({})
    })
  })

  describe('setCachePath', () => {
    it('sets history path in cache', () => {
      loadCache(true)
      const history = { '1-1-3': { fFormation: 'Line Ahead', title: 'Test', smokeType: 0 } }
      setCachePath('history', history)
      expect(getCache().history).toEqual(history)
    })

    it('sets useitem path in cache', () => {
      loadCache(true)
      const useitem = { 10: { api_id: 10, api_count: 5 } }
      setCachePath('useitem', useitem)
      expect(getCache().useitem).toEqual(useitem)
    })
  })

  describe('saveCache', () => {
    it('persists cache to localStorage after debounce', async () => {
      setCachePath('history', { '2-3-5': { fFormation: 'Diamond' } })
      saveCache()
      // Advance past the 5 second debounce
      await vi.runAllTimersAsync()
      const stored = localStorage.getItem(LS_PATH)
      expect(stored).not.toBeNull()
      expect(JSON.parse(stored!)).toMatchObject({ history: { '2-3-5': { fFormation: 'Diamond' } } })
    })
  })
})
