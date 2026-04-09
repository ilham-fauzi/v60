import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AIState, AIOptimization } from '@/types'

interface AIActions {
  setThinking: (thinking: boolean) => void
  setLastSuggestion: (suggestion: string | null) => void
  addOptimization: (opt: AIOptimization) => void
  setOptimizations: (opts: AIOptimization[]) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: AIState = {
  isThinking: false,
  lastSuggestion: null,
  optimizations: [],
  error: null,
}

export const useAIStore = create<AIState & AIActions>()(
  devtools(
    (set) => ({
      ...initialState,
      setThinking: (isThinking) => set({ isThinking }),
      setLastSuggestion: (lastSuggestion) => set({ lastSuggestion }),
      addOptimization: (opt) => set((s) => ({ optimizations: [...s.optimizations, opt] })),
      setOptimizations: (optimizations) => set({ optimizations }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    { name: 'AIStore' }
  )
)
