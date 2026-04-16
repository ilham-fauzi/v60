'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoginPageV2 from './LoginPageV2'
import { Loader2 } from 'lucide-react'

export function LoginGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary-container" />
      </div>
    )
  }

  if (!session) {
    return <LoginPageV2 />
  }

  return <>{children}</>
}
