import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      loading: false,

      setProjects: (projects) => set({ projects }),

      addProject: (project) => set((state) => ({
        projects: [project, ...state.projects]
      })),

      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
        currentProject: state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject
      })),

      removeProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject
      })),

      setCurrentProject: (project) => set({ currentProject: project }),

      setLoading: (loading) => set({ loading }),

      clearAll: () => set({ projects: [], currentProject: null })
    }),
    {
      name: 'shortai-projects'
    }
  )
)
