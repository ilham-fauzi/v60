/**
 * BrewForce Identity Utilities
 * Anonymous, persistent user identity via localStorage UUID.
 * No PII, no login required.
 */

const ANON_ID_KEY = 'bf_anon_id'

/**
 * Initialize user identity on first app load.
 * Safe to call multiple times — idempotent.
 * Must be called client-side only.
 */
export function initUser(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(ANON_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANON_ID_KEY, id)
  }
  return id
}

/**
 * Get the current user's anonymous ID.
 * Returns empty string during SSR.
 */
export function getAnonId(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(ANON_ID_KEY) ?? initUser()
}
