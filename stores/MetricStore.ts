import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { backendFetch } from '@/services/backend'

interface MetricState {
  totalRecipes: number
  totalBrews: number
  favoriteOrigin: string
  avgRating: number
  isLoading: boolean
  lastUpdated: number | null
}

interface MetricActions {
  initMetrics: () => Promise<void>
}

export const useMetricStore = create<MetricState & MetricActions>()(
  devtools(
    (set) => ({
      totalRecipes: 0,
      totalBrews: 0,
      favoriteOrigin: 'Unknown',
      avgRating: 0,
      isLoading: false,
      lastUpdated: null,

      initMetrics: async () => {
        set({ isLoading: true })
        try {
          const data = await backendFetch('/v1/metrics')
          set({
            totalRecipes: data.totalRecipes || 0,
            totalBrews: data.totalBrews || 0,
            favoriteOrigin: data.favoriteOrigin || 'N/A',
            avgRating: data.avgRating || 0,
            lastUpdated: Date.now(),
            isLoading: false
          })
        } catch (error) {
          console.error('Failed to fetch metrics:', error)
          set({ isLoading: false })
        }
      }
    })
  )
)
