/**
 * BrewForce Encrypted Storage Utilities
 * Wraps localStorage with AES-GCM encryption using the user's anonId as key.
 * Provides obfuscation from casual inspection — not a hard security boundary.
 */

import { encrypt, decrypt } from './crypto'
import { getAnonId } from './identity'
import type { Recipe } from '@/types'

// ── Key helpers ──────────────────────────────────────────────────────────────
export const RECIPE_KEY = (localId: string) => `bf_recipe_${localId}`
export const SHARED_CACHE_KEY = (nanoId: string) => `bf_shared_${nanoId}`

// ── StoredRecipe shape (what lives in localStorage) ───────────────────────────
export interface StoredRecipe {
  id: string          // local UUID, stable across edits
  nanoId: string | null
  isShared: boolean
  shareChain: string[]
  data: Recipe
}

// ── StoredSharedCache shape (recipient cache) ─────────────────────────────────
export interface StoredSharedCache {
  token: string
  shareChain: string[]
  savedAt: number
  data: Recipe
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function saveRecipe(recipe: StoredRecipe): Promise<void> {
  const anonId = getAnonId()
  const encrypted = await encrypt(recipe, anonId)
  localStorage.setItem(RECIPE_KEY(recipe.id), encrypted)
}

export async function saveSharedCache(cache: StoredSharedCache): Promise<void> {
  const anonId = getAnonId()
  const encrypted = await encrypt(cache, anonId)
  localStorage.setItem(SHARED_CACHE_KEY(cache.token), encrypted)
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function loadRecipe(localId: string): Promise<StoredRecipe | null> {
  const raw = localStorage.getItem(RECIPE_KEY(localId))
  if (!raw) return null
  const anonId = getAnonId()
  return decrypt<StoredRecipe>(raw, anonId)
}

export async function loadSharedCache(nanoId: string): Promise<StoredSharedCache | null> {
  const raw = localStorage.getItem(SHARED_CACHE_KEY(nanoId))
  if (!raw) return null
  const anonId = getAnonId()
  return decrypt<StoredSharedCache>(raw, anonId)
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function deleteRecipe(localId: string): void {
  localStorage.removeItem(RECIPE_KEY(localId))
}

export function deleteSharedCache(nanoId: string): void {
  localStorage.removeItem(SHARED_CACHE_KEY(nanoId))
}

// ── List all local recipe IDs ─────────────────────────────────────────────────

export function listLocalRecipeIds(): string[] {
  if (typeof window === 'undefined') return []
  return Object.keys(localStorage)
    .filter(k => k.startsWith('bf_recipe_'))
    .map(k => k.replace('bf_recipe_', ''))
}
