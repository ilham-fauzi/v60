import { supabase } from '@/lib/supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export async function backendFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers = new Headers(options.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  headers.set('Content-Type', 'application/json')

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }))
    const errorMessage = errorBody.error || `HTTP error! status: ${response.status}`
    console.error(`[API Error] ${options.method || 'GET'} ${path}:`, errorMessage)
    throw new Error(errorMessage)
  }

  if (response.status === 204) return null
  return response.json()
}
