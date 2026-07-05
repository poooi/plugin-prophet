import '@testing-library/jest-dom'

// Setup Poi global mocks
const mockConfig = {
  get: (key: string, defaultVal?: unknown) => defaultVal,
  set: (_key: string, _val: unknown) => {},
}

const mockWindow = {
  config: mockConfig,
  getStore: (_path: string, defaultVal?: unknown) => defaultVal,
  dispatch: (_action: unknown) => {},
  notify: (_msg: string, _opts?: unknown) => {},
  ipc: {
    access: (_name: string) => ({}),
  },
  dbg: {
    isEnabled: () => false,
  },
  APPDATA_PATH: '/tmp/poi-test',
  ROOT: '/tmp/poi-root',
  isSafeMode: false,
  isDarkTheme: true,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  $ships: {} as Record<number, unknown>,
  $slotitems: {} as Record<number, unknown>,
}

Object.assign(global, mockWindow)
Object.assign(global.window, mockWindow)

;(global as any).config = mockConfig
