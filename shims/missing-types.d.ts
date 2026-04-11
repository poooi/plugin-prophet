declare module 'bluebird' {
  class BluePromise<T> extends Promise<T> {
    static each<T>(
      array: T[],
      iterator: (item: T, index: number, length: number) => PromiseLike<void> | void,
    ): BluePromise<T[]>
  }
  export = BluePromise
}

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

declare module 'react-fontawesome' {
  import type React from 'react'
  interface FontAwesomeProps {
    name: string
    [key: string]: unknown
  }
  const FontAwesome: React.FC<FontAwesomeProps>
  export default FontAwesome
}
