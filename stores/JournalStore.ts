import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

export interface LogEntry {
  id: string
  date: string
  recipeId: string
  recipeName: string
  method: string
  score: number // 1-10
  notes: string
  stats: {
    coffee: number
    water: number
    time: string
    tds?: number
  }
}

interface JournalState {
  logs: LogEntry[]
}

interface JournalActions {
  addLog: (log: LogEntry) => void
  removeLog: (id: string) => void
  clearLogs: () => void
}

export const useJournalStore = create<JournalState & JournalActions>()(
  devtools(
    persist(
      (set) => ({
        logs: [],
        addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
        removeLog: (id) => set((state) => ({ logs: state.logs.filter(l => l.id !== id) })),
        clearLogs: () => set({ logs: [] })
      }),
      {
        name: 'brewmaster-journal',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
)
