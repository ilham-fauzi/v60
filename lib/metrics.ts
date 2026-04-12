/**
 * BrewForce Metrics Utilities — Plan 2 Scaffold
 *
 * Fire-and-forget event tracking. Safe to call anywhere.
 * Never throws, never blocks UI.
 * NOT yet wired to any app flow — integration in a future sprint.
 */

export type MetricEvent =
  | 'user_init'       // first app load
  | 'recipe_created'  // user saves a new recipe
  | 'recipe_shared'   // user clicks Share
  | 'brew_started'    // user starts a brew session

export interface TrackPayload {
  anonId?: string
  tokenId?: string   // SHA256(nanoId)
  localId?: string   // stable recipe UUID in localStorage
  source?: 'local' | 'shared'
}

/**
 * Track an anonymous metric event.
 * Safe to call from any component or utility.
 * Silently fails if the API is unavailable.
 */
export function track(event: MetricEvent, payload: TrackPayload = {}): void {
  // Fire-and-forget: no await, no visible catch
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      ...payload,
      created_at: Math.floor(Date.now() / 1000),
    }),
  }).catch(() => {
    // Silently swallow errors — metrics must never affect UX
  })
}
