'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      // Small delay to allow Supabase client to process the URL fragment/query
      // The LoginGuard in layout.tsx will also be listening for auth state changes
      setTimeout(() => {
        router.push('/')
      }, 500)
    }
    handleAuth()
  }, [router])

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#0a0a0b] text-white">
      {/* Decorative Background Layer */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-radial-gradient from-[#ffbf00]/10 to-transparent" />
      </div>

      <div className="flex flex-col items-center gap-6 z-10">
        <div className="w-16 h-16 bg-[#ffbf00]/20 rounded-2xl flex items-center justify-center border border-[#ffbf00]/30 shadow-[0_0_40px_-10px_rgba(255,191,0,0.3)]">
          <Loader2 className="w-8 h-8 animate-spin text-[#ffbf00]" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl font-bold tracking-tight uppercase">Synchronizing Identity</h2>
          <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Establishing Secure Auth Node Connection...</p>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-12 text-center">
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 font-bold">BrewForce v2 // Authentication Module</p>
      </div>
    </div>
  )
}
