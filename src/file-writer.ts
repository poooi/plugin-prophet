import Bluebird from 'bluebird'
import { writeJSON, ensureDir } from 'fs-extra'
import type { WriteOptions } from 'fs-extra'
import { dirname } from 'path-extra'

type WriteEntry = [string, unknown, WriteOptions | null | undefined, ((err: Error | null) => void) | undefined]

export default class FileWriter {
  private writing = false
  private _queue: WriteEntry[] = []

  write(path: string, data: unknown, options?: WriteOptions | null, callback?: (err: Error | null) => void): void {
    this._queue.push([path, data, options, callback])
    this._continueWriting()
  }

  private async _continueWriting(): Promise<void> {
    if (this.writing) return
    this.writing = true
    const queue = this._queue.slice()
    this._queue = []
    await Bluebird.each(queue, async ([path, data, options, callback]: WriteEntry) => {
      await ensureDir(dirname(path))
      try {
        await writeJSON(path, data, options ?? undefined)
        if (callback) callback(null)
      } catch (e) {
        if (callback) callback(e instanceof Error ? e : new Error(String(e)))
      }
    })
    this.writing = false
  }
}
