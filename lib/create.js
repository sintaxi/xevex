import { create as zustandCreate } from 'zustand'
import { createBaseConvexSlice } from './createBaseConvexSlice.js'

export function create(initializer) {
  // Create the convex slice first (no connection yet)
  const convexSlice = createBaseConvexSlice()

  // Create the Zustand store with both user state and convex slice
  const useStore = zustandCreate((set, get) => {
    const convexState = convexSlice(set, get)
    const userState = typeof initializer === 'function' ? initializer(set, get) : initializer || {}

    return {
      ...convexState,
      ...userState
    }
  })

  // Add connect method to the store hook
  useStore.connect = function(convexUrl) {
    const state = useStore.getState()
    state.connect(convexUrl)
    return useStore
  }

  return useStore
}

export default create
