'use client'

import { useEffect } from 'react'
import { initUser } from '@/lib/identity'

/**
 * Initializes anonymous user identity on first app load.
 * Runs client-side only — generates UUID if not present in localStorage.
 * Idempotent: safe to call multiple times.
 */
export function UserInit() {
  useEffect(() => {
    initUser()
  }, [])
  return null
}
