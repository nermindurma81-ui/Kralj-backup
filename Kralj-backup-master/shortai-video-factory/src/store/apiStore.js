import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useApiStore = create(
  persist(
    (set, get) => ({
      providers: [],
      activeProvider: null,
      loading: false,

      setProviders: (providers) => set({ providers }),

      addProvider: (provider) => set((state) => ({
        providers: [...state.providers, { ...provider, id: provider.id || crypto.randomUUID() }]
      })),

      updateProvider: (id, updates) => set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        )
      })),

      removeProvider: (id) => set((state) => ({
        providers: state.providers.filter((p) => p.id !== id),
        activeProvider: state.activeProvider?.id === id ? null : state.activeProvider
      })),

      setActiveProvider: (provider) => set({ activeProvider: provider }),

      getActiveProvider: () => {
        const state = get()
        if (state.activeProvider) return state.activeProvider
        const enabled = state.providers.find(p => p.enabled)
        if (enabled) return enabled
        // Auto-detect from env (Vercel injects VITE_ prefixed vars)
        const envKey = import.meta.env.VITE_GROQ_API_KEY
        if (envKey) {
          const autoProvider = {
            id: 'auto-groq',
            provider: 'groq',
            name: 'Groq (Auto)',
            api_key: envKey,
            base_url: 'https://api.groq.com/openai/v1',
            model: 'llama-3.3-70b-versatile',
            enabled: true
          }
          set({ providers: [...state.providers, autoProvider], activeProvider: autoProvider })
          return autoProvider
        }
        return null
      },

      setLoading: (loading) => set({ loading }),

      clearAll: () => set({ providers: [], activeProvider: null })
    }),
    {
      name: 'shortai-api-providers'
    }
  )
)
