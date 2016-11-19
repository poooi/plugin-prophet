
import { promisify, promisifyAll } from 'bluebird'
import CSON from 'cson'
import path from 'path-extra'
import _fs from 'fs-extra'
const fs = promisifyAll(_fs)

export reducer = function(state={}, action) {
  if (action.type == '@@poi-plugin-prophet/updateMapspot')
    return {...state, mapspot: action.data}
  if (action.type == '@@poi-plugin-prophet/updateMaproute')
    return {...state, maproute: action.data}
  return state
}

export read = async function() {
  try {
    const data = await fs.readFileAsync(path.join(__dirname, 'assets', 'data', 'mapspot.cson'))
    const mapspot = CSON.parseCSONString(data)
    store.dispatch({
      type: '@@poi-plugin-prophet/updateMapspot',
      data: mapspot,
    })
  catch (e) {
    console.error(`Failed to load mapspot.`, '\n', e.stack)
  }
  try {
    const data = await fs.readFileAsync(path.join(__dirname, 'assets', 'data', 'maproute.cson'))
    const maproute = CSON.parseCSONString(data)
    store.dispatch({
      type: '@@poi-plugin-prophet/updateMaproute',
      data: maproute,
    })
  catch (e) {
    console.error(`Failed to load maproute.`, '\n', e.stack)
  }
}