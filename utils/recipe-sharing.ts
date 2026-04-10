import type { Recipe } from '@/types'

/**
 * Stateless Recipe Sharing Utility
 * Encodes recipe data into a URL-friendly Base64 string.
 */

export function encodeRecipeForSharing(recipe: Recipe): string {
  try {
    // We only need the core data for sharing
    const shareData = {
      n: recipe.name,
      m: recipe.method,
      c: recipe.coffeeGrams,
      w: recipe.waterGrams,
      r: recipe.ratio,
      t: recipe.temperature,
      g: recipe.grindSize,
      o: recipe.beanOrigin,
      s: recipe.stages.map(s => ({
        n: s.name,
        w: s.targetWeight,
        s: s.targetSeconds,
        t: s.temperature
      }))
    }
    
    const json = JSON.stringify(shareData)
    // Use Unicode-safe base64 encoding
    return btoa(encodeURIComponent(json))
  } catch (error) {
    console.error('Failed to encode recipe:', error)
    return ''
  }
}

export function decodeRecipeFromSharing(encoded: string): Partial<Recipe> | null {
  try {
    const json = decodeURIComponent(atob(encoded))
    const data = JSON.parse(json)
    
    return {
      name: data.n,
      method: data.m,
      coffeeGrams: data.c,
      waterGrams: data.w,
      ratio: data.r,
      temperature: data.t,
      grindSize: data.g,
      beanOrigin: data.o,
      stages: data.s?.map((s: any, idx: number) => ({
        id: `shared-${idx}-${Date.now()}`,
        name: s.n,
        targetWeight: s.w,
        targetSeconds: s.s,
        temperature: s.t
      }))
    }
  } catch (error) {
    console.error('Failed to decode recipe:', error)
    return null
  }
}

export function generateRecipeSlug(recipe: Recipe): string {
  const nameSlug = recipe.name
    .toLowerCase()
    .replace(/[^a-z0-0]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30)
  
  const timeHash = Math.floor(Date.now() / 1000).toString(36)
  return `${nameSlug}-${timeHash}`
}
