import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { backendFetch } from '@/services/backend'

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
  addLog: (log: LogEntry) => Promise<void>
  removeLog: (id: string) => void
  clearLogs: () => void
  initLogs: (recipes?: any[]) => Promise<void>
}

export const useJournalStore = create<JournalState & JournalActions>()(
  devtools(
    persist(
      (set) => ({
        logs: [],
        addLog: async (log: LogEntry) => {
          set((state: JournalState) => ({ logs: [log, ...state.logs] }))
          
          try {
            // IDs that are local-only and should NOT be sent as a FK reference.
            // These prefixes are used for recipes that haven't been synced to Oracle yet.
            const isLocalId = !log.recipeId ||
              log.recipeId === 'manual' ||
              log.recipeId.startsWith('cloud-') ||
              log.recipeId.startsWith('local-') ||
              log.recipeId.startsWith('temp-')

            // Sync to Oracle via Go Backend
            await backendFetch('/v1/sessions', {
              method: 'POST',
              body: JSON.stringify({
                id: log.id,
                recipeId: isLocalId ? undefined : log.recipeId,
                finalWeight: log.stats.water,
                historyJson: JSON.stringify(log.stats),
                sensoryFeedback: JSON.stringify({ score: log.score, notes: log.notes })
              })
            })
          } catch (error) {
            console.error('Failed to sync log to backend:', error)
          }
        },

        removeLog: (id: string) => set((state: JournalState) => ({ logs: state.logs.filter((l: LogEntry) => l.id !== id) })),
        clearLogs: () => set({ logs: [] }),
        initLogs: async (recipes?: any[]) => {
          try {
            const sessions = await backendFetch('/v1/sessions')
            const logs: LogEntry[] = (Array.isArray(sessions) ? sessions : []).map((s: any) => {
              let stats = { coffee: 0, water: 0, time: '0:00', method: 'v60' }
              try {
                stats = { ...stats, ...JSON.parse(s.historyJson || '{}') }
              } catch (e) { /* ignore parse error */ }
              
              let feedback = { score: 0, notes: '' }
              try {
                feedback = { ...feedback, ...JSON.parse(s.sensoryFeedback || '{}') }
              } catch (e) { /* ignore parse error */ }

              // Try to find recipe name from provided recipes list
              let recipeName = 'Historical Brew'
              if (recipes && s.recipeId) {
                const found = recipes.find(r => r.id === s.recipeId)
                if (found) recipeName = found.name
              } else if (!s.recipeId || s.recipeId === 'manual') {
                recipeName = 'Free Brew'
              }

              return {
                id: s.id,
                date: new Date(s.startedAt).toLocaleDateString() + ' ' + new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                recipeId: s.recipeId || 'manual',
                recipeName: recipeName,
                method: stats.method || 'v60',
                score: feedback.score || 0,
                notes: feedback.notes || '',
                stats: {
                  coffee: stats.coffee || 0,
                  water: s.finalWeight || stats.water || 0,
                  time: stats.time || '0:00'
                }
              }
            })
            set({ logs })
          } catch (error) {
            console.error('Failed to fetch historical logs:', error)
          }
        }
      }),
      {
        name: 'brewmaster-journal',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
)
