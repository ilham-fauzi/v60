/**
 * BrewForce Recipe Sharing Logic
 *
 * Handles the full share lifecycle:
 * - shareRecipe(): creator shares (or re-shares after edit) — accepts Recipe directly
 * - buildRecipientChain(): recipient appends their UUID before re-sharing
 * - reshareRecipe(): recipient re-shares someone else's recipe
 * - revokeShare(): creator unshares a recipe
 *
 * Share state (nanoId, shareChain) is tracked in localStorage under a
 * separate key per recipe ID, keeping it decoupled from the Zustand store.
 */

import { nanoid } from 'nanoid'
import { encrypt, hashToken } from './crypto'
import { getAnonId } from './identity'
import type { Recipe } from '@/types'

const THREE_DAYS_SECONDS = 60 * 60 * 24 * 3

// ── Share state persisted per recipe in localStorage ─────────────────────────
// Key: bf_share_meta_<recipeId>
// Value: JSON { nanoId: string, shareChain: string[] }

interface ShareMeta {
  nanoId: string
  shareChain: string[]
}

function getShareMeta(recipeId: string): ShareMeta | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(`bf_share_meta_${recipeId}`)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function setShareMeta(recipeId: string, meta: ShareMeta): void {
  localStorage.setItem(`bf_share_meta_${recipeId}`, JSON.stringify(meta))
}

function clearShareMeta(recipeId: string): void {
  localStorage.removeItem(`bf_share_meta_${recipeId}`)
}

// ── Helper: post to SQLite ────────────────────────────────────────────────────

async function postShare(
  tokenId: string,
  encryptedData: string,
  shareChain: string[],
  now: number
): Promise<boolean> {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token_id: tokenId,
      data: encryptedData,
      share_chain: shareChain,
      created_at: now,
      expires_at: now + THREE_DAYS_SECONDS,
    }),
  })
  return res.ok
}

// ── Share a recipe (creator) ──────────────────────────────────────────────────

/**
 * Share a recipe to SQLite.
 * - If already shared: silently deletes the old token and creates a new one.
 * - share_chain always starts fresh from the current user (Option A: reset on re-share).
 * - Copies the share URL to clipboard silently.
 * - Returns the full share URL or null on failure.
 */
export async function shareRecipe(recipe: Recipe): Promise<string | null> {
  const anonId = getAnonId()
  const existingMeta = getShareMeta(recipe.id)

  // Delete old SQLite entry if it exists
  if (existingMeta?.nanoId) {
    const oldHash = await hashToken(existingMeta.nanoId)
    await fetch(`/api/share/${oldHash}`, { method: 'DELETE' }).catch(() => {})
  }

  const newNanoId = nanoid()
  const newTokenId = await hashToken(newNanoId)
  const now = Math.floor(Date.now() / 1000)
  const shareChain = [anonId]

  // Encrypt recipe with the new nanoId as key (server is zero-knowledge)
  const encryptedData = await encrypt(recipe, newNanoId)
  const ok = await postShare(newTokenId, encryptedData, shareChain, now)
  if (!ok) return null

  // Persist share metadata locally so we can revoke/replace later
  setShareMeta(recipe.id, { nanoId: newNanoId, shareChain })

  const url = `${window.location.origin}/b/${newNanoId}`
  navigator.clipboard.writeText(url).catch(() => {})
  return url
}

/**
 * Build the share chain for a RECIPIENT re-sharing.
 * Appends current user's anonId to the existing chain.
 * Called when recipient clicks "Share" WITHOUT editing.
 */
export function buildRecipientChain(existingChain: string[]): string[] {
  const anonId = getAnonId()
  if (existingChain[existingChain.length - 1] === anonId) return existingChain
  return [...existingChain, anonId]
}

/**
 * Share a recipe that was received from someone else (recipient re-shares).
 * Appends the recipient's UUID to the share chain.
 * chainReset = true when recipient edited before sharing (chain reset).
 */
export async function reshareRecipe(
  recipeData: Recipe,
  existingChain: string[],
  oldNanoId?: string,
  chainReset?: boolean
): Promise<string | null> {
  const newNanoId = nanoid()
  const newTokenId = await hashToken(newNanoId)
  const now = Math.floor(Date.now() / 1000)

  // Delete old token if replacing
  if (oldNanoId) {
    const oldHash = await hashToken(oldNanoId)
    await fetch(`/api/share/${oldHash}`, { method: 'DELETE' }).catch(() => {})
  }

  const shareChain = chainReset
    ? [getAnonId()]
    : buildRecipientChain(existingChain)

  const encryptedData = await encrypt(recipeData, newNanoId)
  const ok = await postShare(newTokenId, encryptedData, shareChain, now)
  if (!ok) return null

  const url = `${window.location.origin}/b/${newNanoId}`
  navigator.clipboard.writeText(url).catch(() => {})
  return url
}

/**
 * Revoke a shared recipe — removes from SQLite and clears local share metadata.
 */
export async function revokeShare(recipeId: string): Promise<void> {
  const meta = getShareMeta(recipeId)
  if (!meta?.nanoId) return

  const hash = await hashToken(meta.nanoId)
  await fetch(`/api/share/${hash}`, { method: 'DELETE' }).catch(() => {})
  clearShareMeta(recipeId)
}

/**
 * Check if a recipe is currently shared (has active share metadata).
 */
export function isShared(recipeId: string): boolean {
  return getShareMeta(recipeId) !== null
}

/**
 * Get the current share URL for a recipe (if shared), without re-creating.
 */
export function getShareUrl(recipeId: string): string | null {
  const meta = getShareMeta(recipeId)
  if (!meta?.nanoId || typeof window === 'undefined') return null
  return `${window.location.origin}/b/${meta.nanoId}`
}
