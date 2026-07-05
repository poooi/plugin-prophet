// Mock for views/create-store
import { createStore } from 'redux'

const defaultReducer = (state = {}) => state
export const store = createStore(defaultReducer)
export default store
