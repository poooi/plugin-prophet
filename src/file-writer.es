// copy from vires/utils/FileWriter.es
// we use writeJSON instead of writeFile

import Promise from 'bluebird'
import { writeJSON, ensureDir } from 'fs-extra'
import { dirname } from 'path-extra'

// A stream of async file writing. `write` queues the task which will be executed
// after all tasks before are done.
// Every instance contains an independent queue.
// Usage:
// var fw = new FileWriter()
// var path = '/path/to/a/file'
// for (var i = 0; i < 100; i++) {
//   fw.write(path, (''+i).repeat(10000))
// }
export default class FileWriter {
  constructor() {
    this.writing = false
    this._queue = []
  }

  write(path, data, options, callback) {
    this._queue.push([path, data, options, callback])
    this._continueWriting()
  }

  async _continueWriting() {
    if (this.writing) {
      return
    }
    this.writing = true
    const queue = this._queue.slice()
    this._queue = []
    await Promise.each(queue, async ([path, data, options, callback]) => {
      await ensureDir(dirname(path))
      const err = await writeJSON(path, data, options)
      if (callback) {
        callback(err)
      }
    })
    this.writing = false
  }
}
