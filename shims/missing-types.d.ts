declare module 'fs-extra' {
  export interface WriteOptions {
    spaces?: number | string
    EOL?: string
    replacer?: ((key: string, value: unknown) => unknown) | null
    encoding?: string
    mode?: number
    flag?: string
  }
  export function writeJSON(file: string, object: unknown, options?: WriteOptions | null): Promise<void>
  export function ensureDir(dir: string): Promise<void>
}

declare module 'path-extra' {
  export * from 'path'
  export function dirname(path: string): string
}

declare module 'redux-observers' {
  import type { Store, Dispatch } from 'redux'
  type ObserverFn<S = unknown> = (state: S, dispatch: Dispatch, options: object) => void
  export function observe<S>(store: Store<S>, observers: ObserverFn<S>[], options?: object): () => void
  export function observer<S, T>(
    selector: (state: S, ...args: any[]) => T,
    dispatcher: (dispatch: unknown, current: T | undefined, previous: T | undefined) => void,
    locals?: object,
  ): ObserverFn<S>
  export function shallowEquals(a: unknown, b: unknown): boolean
}

declare module 'react-fontawesome' {
  import type React from 'react'
  interface FontAwesomeProps {
    name: string
    [key: string]: unknown
  }
  const FontAwesome: React.FC<FontAwesomeProps>
  export default FontAwesome
}
