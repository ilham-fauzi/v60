import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Recipe, RecipeState, BrewMethod, GrindSize } from '@/types'

interface RecipeActions {
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'stages'> & { stages: Omit<Recipe['stages'][number], 'id'>[] }) => Promise<Recipe>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  cloneRecipe: (id: string) => Promise<Recipe | null>
  scaleRecipe: (id: string, newCoffeeGrams: number) => Recipe | null
  getRecipeById: (id: string) => Recipe | undefined
  initRecipes: () => Promise<void>
}

export const useRecipeStore = create<RecipeState & RecipeActions>()(
  devtools(
    (set, get) => ({
      recipes: [],
      isLoading: false,

      initRecipes: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/recipes')
          const data = await res.json()
          
          if (Array.isArray(data) && data.length > 0) {
            set({ recipes: data, isLoading: false })
          } else {
            // Seed defaults if empty
            // For now just set empty, assuming DB initialization handled seeding or will be handled
            set({ recipes: data || [], isLoading: false })
          }
        } catch (error) {
          console.error('Failed to init recipes:', error)
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
        set((s) => ({ recipes: [newRecipe, ...s.recipes] }))
        return newRecipe
      },

      updateRecipe: async (id, updates) => {
        const res = await fetch(`/api/recipes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        const updated = await res.json()
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? updated : r)),
        }))
      },

      deleteRecipe: async (id) => {
        await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
        set((s) => ({
          recipes: s.recipes.filter((r) => r.id !== id),
        }))
      },

      cloneRecipe: async (id) => {
        const recipe = get().getRecipeById(id)
        if (!recipe) return null
        
        const { id: _, createdAt: __, updatedAt: ___, stages, ...rest } = recipe
        const recipeData = {
          ...rest,
          // Remove IDs from stages so the API can create new ones
          stages: stages.map(({ id: ____, ...s }) => s),
        }
        
        return get().addRecipe(recipeData)
      },

      scaleRecipe: (id, newCoffeeGrams) => {
        const recipe = get().getRecipeById(id)
        if (!recipe) return null
        const scaleFactor = newCoffeeGrams / recipe.coffeeGrams
        
        // This remains client-side for "previewing" or temporary use
        const scaled: Recipe = {
          ...recipe,
          id: `temp-${Date.now()}`,
          name: `${recipe.name} (${newCoffeeGrams}g)`,
          coffeeGrams: newCoffeeGrams,
          waterGrams: parseFloat((recipe.waterGrams * scaleFactor).toFixed(1)),
          stages: recipe.stages.map((s) => ({
            ...s,
            id: `temp-s-${Math.random()}`,
            targetWeight: parseFloat((s.targetWeight * scaleFactor).toFixed(1)),
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return scaled
      },

      getRecipeById: (id) => get().recipes.find((r) => r.id === id),
    }),
    { name: 'RecipeStore' }
  )
)
