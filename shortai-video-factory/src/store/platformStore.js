import { create } from 'zustand'

export const usePlatformStore = create((set, get) => ({
  connections: [],
  loading: false,

  setConnections: (connections) => set({ connections }),

  addConnection: (connection) => set((state) => ({
    connections: [...state.connections.filter(c => c.platform !== connection.platform), connection]
  })),

  removeConnection: (id) => set((state) => ({
    connections: state.connections.filter((c) => c.id !== id)
  })),

  isConnected: (platform) => {
    return get().connections.some(c => c.platform === platform && c.connected)
  },

  getConnection: (platform) => {
    return get().connections.find(c => c.platform === platform) || null
  },

  setLoading: (loading) => set({ loading }),

  clearAll: () => set({ connections: [] })
}))
