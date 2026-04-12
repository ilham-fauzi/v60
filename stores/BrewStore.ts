import { create } from 'zustand'
import { devtools, subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware'
import type {
  BrewState,
  WeightDataPoint,
  Recipe,
  BrewSession,
  ScaleConnectionState,
} from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface BrewActions {
  setScaleConnection: (connection: ScaleConnectionState) => void
  onWeightUpdate: (weight: number) => void
  tare: () => void
  toggleBrew: () => void
  pauseBrew: () => void
  resumeBrew: () => void
  stopBrew: () => void
  tick: () => void
  nextStage: () => void
  setActiveRecipe: (recipe: Recipe | null) => void
  toggleFocusMode: () => void
  toggleSidebar: () => void
  resetSession: () => void
  getNextStage: (elapsedTime: number) => string | null
  setReverseDrawdownEnabled: (enabled: boolean) => void
}

function computeFlowRate(history: WeightDataPoint[], currentWeight: number, now: number): number {
  if (history.length < 2) return 0
  const recent = history[history.length - 1]
  const deltaWeight = currentWeight - recent.weight
  const deltaTime = (now - recent.timestamp) / 1000
  if (deltaTime <= 0) return 0
  return Math.max(0, parseFloat((deltaWeight / deltaTime).toFixed(2)))
}

const initialState: BrewState = {
  scaleConnection: { type: null, connected: false },
  currentWeight: 0,
  targetWeight: 0,
  currentFlowRate: 0,
  isBrewing: false,
  isPaused: false,
  elapsedTime: 0,
  currentStageIndex: 0,
  history: [],
  currentSession: null,
  activeRecipe: null,
  isFocusMode: false,
  isSidebarCollapsed: false,
  totalElapsedTime: 0,
  reverseDrawdownEnabled: true,
}

export const useBrewStore = create<BrewState & BrewActions>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        ...initialState,

        setScaleConnection: (connection) => set({ scaleConnection: connection }),

        onWeightUpdate: (weight) => {
          const state = get()
          if (!state.isBrewing || state.isPaused) {
            set({ currentWeight: weight })
            return
          }
          const now = Date.now()
          const startTime = state.currentSession?.startedAt
            ? new Date(state.currentSession.startedAt).getTime()
            : now
          const timestamp = now - startTime
          const flowRate = computeFlowRate(state.history, weight, now)
          const newPoint: WeightDataPoint = { timestamp, weight, flowRate }
          set((s) => ({
            currentWeight: weight,
            currentFlowRate: flowRate,
            history: [...s.history, newPoint],
          }))
        },

        tare: () => set({ currentWeight: 0, currentFlowRate: 0 }),

        toggleBrew: () => {
          const state = get()
          if (!state.isBrewing) {
            const session: BrewSession = {
              id: uuidv4(),
              recipeId: state.activeRecipe?.id ?? 'manual',
              startedAt: new Date().toISOString(),
              history: [],
              finalWeight: 0,
            }
            set({ 
              isBrewing: true, 
              isPaused: false, 
              elapsedTime: 0, 
              totalElapsedTime: 0,
              currentStageIndex: 0, 
              history: [], 
              currentSession: session 
            })
          } else {
            const { currentSession, currentWeight, history } = state
            if (currentSession) {
              set({ isBrewing: false, currentSession: { ...currentSession, completedAt: new Date().toISOString(), finalWeight: currentWeight, history } })
            } else {
              set({ isBrewing: false })
            }
          }
        },

        pauseBrew: () => set({ isPaused: true }),
        resumeBrew: () => set({ isPaused: false }),

        stopBrew: async () => {
          const { currentSession, currentWeight, history, activeRecipe } = get()
          if (!currentSession) {
            set({ isBrewing: false, isPaused: false, currentFlowRate: 0 })
            return
          }

          const completedSession = {
            ...currentSession,
            completedAt: new Date().toISOString(),
            finalWeight: currentWeight,
            history
          }

          set({
            isBrewing: false,
            isPaused: false,
            currentSession: completedSession,
            currentFlowRate: 0,
          })

          try {
            // Dynamically import JournalStore to avoid circular dependencies
            const { useJournalStore } = await import('@/stores/JournalStore')
            
            const start = new Date(completedSession.startedAt)
            const end = new Date(completedSession.completedAt)
            const durationSec = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
            const minutes = Math.floor(durationSec / 60)
            const seconds = durationSec % 60
            
            const recipeName = activeRecipe?.name || 'Unknown Recipe'
            const recipeId = activeRecipe?.id || 'manual'
            const method = activeRecipe?.method || 'v60'
            const coffeeGrams = activeRecipe?.coffeeGrams || 0
            
            useJournalStore.getState().addLog({
              id: completedSession.id,
              date: start.toLocaleString(),
              recipeId,
              recipeName,
              method,
              score: 0,
              notes: '',
              stats: {
                coffee: coffeeGrams,
                water: currentWeight,
                time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
              }
            })
          } catch (error) {
            console.error('Failed to save session to local JournalStore:', error)
          }
        },

        tick: () => {
          const { isBrewing, isPaused, elapsedTime, totalElapsedTime, activeRecipe, currentStageIndex } = get()
          if (!isBrewing || isPaused) return

          const nextElapsedTime = elapsedTime + 1
          const nextTotalElapsedTime = totalElapsedTime + 1
          const currentStage = activeRecipe?.stages[currentStageIndex]

          if (currentStage && nextElapsedTime >= currentStage.targetSeconds) {
            const isLastStage = currentStageIndex === (activeRecipe?.stages.length ?? 0) - 1
            if (isLastStage) {
              // Final stage complete, stop the clock
              set({ 
                isPaused: true, 
                elapsedTime: currentStage.targetSeconds,
                totalElapsedTime: nextTotalElapsedTime 
              })
            } else {
              get().nextStage()
              set({ totalElapsedTime: nextTotalElapsedTime })
            }
          } else {
            set({ elapsedTime: nextElapsedTime, totalElapsedTime: nextTotalElapsedTime })
          }
        },

        nextStage: () => {
          const { activeRecipe, currentStageIndex } = get()
          if (!activeRecipe) return
          const nextIndex = currentStageIndex + 1
          if (nextIndex < activeRecipe.stages.length) {
            set({ 
              currentStageIndex: nextIndex,
              elapsedTime: 0 
            })
          }
        },

        setActiveRecipe: (recipe) => {
          let sanitizedRecipe = recipe
          if (sanitizedRecipe) {
            sanitizedRecipe = {
              ...sanitizedRecipe,
              stages: sanitizedRecipe.stages.map(s => 
                s.name.toLowerCase().includes('drawdown') ? { ...s, targetWeight: 0 } : s
              )
            }
          }
          set({ activeRecipe: sanitizedRecipe, targetWeight: sanitizedRecipe?.waterGrams ?? 0 })
        },

        toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })),
        
        toggleSidebar: () => set((s) => {
          const nextState = !s.isSidebarCollapsed
          // If expanding, make sure we aren't in focus mode
          return { isSidebarCollapsed: nextState }
        }),

        resetSession: () => set({ ...initialState, scaleConnection: get().scaleConnection, activeRecipe: get().activeRecipe }),

        getNextStage: (elapsedTime) => {
          const { activeRecipe, currentStageIndex } = get()
          if (!activeRecipe) return null
          const stage = activeRecipe.stages[currentStageIndex]
          if (!stage) return null
          if (elapsedTime >= stage.targetSeconds) {
            return activeRecipe.stages[currentStageIndex + 1]?.name ?? null
          }
          return null
        },
        setReverseDrawdownEnabled: (enabled) => set({ reverseDrawdownEnabled: enabled }),
      })),
      {
        name: 'brewmaster-session',
        storage: createJSONStorage(() => localStorage),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          let state = persistedState;
          if (version === 0) {
            // Clean up activeRecipe if it exists
            if (state.activeRecipe) {
              state.activeRecipe = {
                ...state.activeRecipe,
                stages: state.activeRecipe.stages.map((s: any) =>
                  s.name.toLowerCase().includes('drawdown') ? { ...s, targetWeight: 0 } : s
                )
              }
            }
          }
          return state;
        }
      }
    )
  )
)
