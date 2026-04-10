import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import type { Recipe, RecipeState } from '@/types'

interface RecipeActions {
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'stages'> & { stages: Omit<Recipe['stages'][number], 'id'>[] }) => Promise<Recipe>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  cloneRecipe: (id: string) => Promise<Recipe | null>
  scaleRecipe: (id: string, newCoffeeGrams: number) => Recipe | null
  getRecipeById: (id: string) => Recipe | undefined
  initRecipes: () => Promise<void>
  addLocalRecipe: (recipe: Recipe) => void
}

export const useRecipeStore = create<RecipeState & RecipeActions>()(
  devtools(
    persist(
      (set, get) => ({
        recipes: [],
        isLoading: false,

        initRecipes: async () => {
          set({ isLoading: true })
          try {
            const res = await fetch('/api/recipes')
            const serverRecipes = await res.json()
            
            set((state: RecipeState) => {
              const localRecipes = state.recipes.filter(r => !r.id.startsWith('cloud-'))
              const markedServer = serverRecipes.map((r: Recipe) => ({ ...r }))

              const combined = [...markedServer]
              localRecipes.forEach((lr: Recipe) => {
                if (!combined.find(sr => sr.id === lr.id)) {
                  combined.push(lr)
                }
              })

              return { recipes: combined, isLoading: false }
            })
          } catch (error) {
            console.error('Failed to init recipes from server:', error)
            set({ isLoading: false })
          }
        },

        addRecipe: async (recipeData) => {
          const res = await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeData),
          })
          const newRecipe = await res.json()
          set((s: RecipeState) => ({ recipes: [newRecipe, ...s.recipes] }))
          return newRecipe
        },

        addLocalRecipe: (recipe: Recipe) => {
          set((s: RecipeState) => {
            if (s.recipes.find(r => r.id === recipe.id)) return s
            return { recipes: [recipe, ...s.recipes] }
          })
        },

        updateRecipe: async (id: string, updates: Partial<Recipe>) => {
          if (id.startsWith('temp-') || id.startsWith('loc-')) {
            set((s: RecipeState) => ({
              recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)),
            }))
            return
          }

          const res = await fetch(`/api/recipes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
          const updated = await res.json()
          set((s: RecipeState) => ({
            recipes: s.recipes.map((r: Recipe) => (r.id === id ? updated : r)),
          }))
        },

        deleteRecipe: async (id: string) => {
          if (!id.startsWith('temp-') && !id.startsWith('loc-')) {
            await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
          }
          set((s: RecipeState) => ({
            recipes: s.recipes.filter((r) => r.id !== id),
          }))
        },

        cloneRecipe: async (id: string) => {
          const recipe = get().getRecipeById(id)
          if (!recipe) return null
          
          const { id: _, createdAt: __, updatedAt: ___, stages, ...rest } = recipe
          const recipeData = {
            ...rest,
            stages: stages.map(({ id: ____, ...s }) => s),
          }
          
          return get().addRecipe(recipeData)
        },

        scaleRecipe: (idValue: string, newCoffeeGrams: number) => {
          const recipe = get().getRecipeById(idValue)
          if (!recipe) return null
          const scaleFactor = newCoffeeGrams / recipe.coffeeGrams
          
          const scaled: Recipe = {
            ...recipe,
            id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: `${recipe.name} (${newCoffeeGrams}g)`,
            coffeeGrams: newCoffeeGrams,
            waterGrams: parseFloat((recipe.waterGrams * scaleFactor).toFixed(1)),
            stages: recipe.stages.map((s) => ({
              ...s,
              id: `loc-s-${Math.random().toString(36).substr(2, 5)}`,
              targetWeight: parseFloat((s.targetWeight * scaleFactor).toFixed(1)),
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          return scaled
        },

        getRecipeById: (id: string) => get().recipes.find((r: Recipe) => r.id === id),
      }),
      { 
        name: 'brewmaster-recipes',
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
)
