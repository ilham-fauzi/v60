'use client'

import React, { useState } from 'react'
import { FlaskConical, AtSign, Lock, Zap, Coffee, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function LoginPageV2() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      if (error.message.includes('provider is not enabled')) {
        setError("Google Login is currently disabled. Please enable it in the Supabase Dashboard (Authentication > Providers) and configure your Client ID/Secret.")
      } else {
        setError(error.message)
      }
    }
    setLoading(false)
  }

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) setError(error.message)
    setLoading(false)
  }
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden bg-surface text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Mesh Gradient Background Layer */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[#131313]" />
        <div className="absolute inset-0" style={{ 
          background: `radial-gradient(at 0% 0%, rgba(255, 191, 0, 0.15) 0px, transparent 50%),
                       radial-gradient(at 100% 100%, rgba(0, 242, 255, 0.08) 0px, transparent 50%),
                       radial-gradient(at 50% 50%, rgba(236, 225, 255, 0.05) 0px, transparent 50%)`
        }} />
      </div>

      {/* Decorative Elements for Depth */}
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary-container/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-secondary-container/5 blur-[100px] pointer-events-none z-0"></div>

      {/* Main Container */}
      <main className="w-full max-w-[1440px] px-6 py-8 sm:py-12 flex flex-col items-center justify-center z-10 relative h-full">
        {/* Brand Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 sm:mb-12 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center shadow-[0_0_40px_-10px_rgba(255,191,0,0.25)]">
              <FlaskConical className="text-on-primary-container w-7 h-7" />
            </div>
            <h1 className="font-display text-4xl font-black tracking-tighter text-primary-container uppercase">
              BrewForce v2
            </h1>
          </div>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold opacity-70">
            Neural Brewing Interface / Auth Node 01
          </p>
        </motion.header>

        {/* Glassmorphic Login Card */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[rgba(32,31,31,0.6)] backdrop-blur-[24px] w-full max-w-md p-6 sm:p-10 rounded-xxxxl flex flex-col gap-6 sm:gap-8 ring-1 ring-white/5 shadow-glow-amber"
        >
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-on-surface">Initiate Protocol</h2>
            <p className="text-on-surface-variant text-sm opacity-80">Secure access to BrewMaster AI laboratory.</p>
          </div>

          {/* Social Login */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-14 flex items-center justify-center gap-3 bg-surface-container-high hover:bg-surface-bright transition-all duration-300 py-3.5 px-4 rounded-xl ring-1 ring-outline-variant font-semibold text-sm group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <img 
                  alt="Google logo" 
                  className="w-5 h-5 block object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" 
                />
              )}
              <span className="text-on-surface">Sign in with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 bg-[#1a1a1a] text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">or via credentials</span>
          </div>

          {/* Standard Auth Form */}
          <form className="flex flex-col gap-4 sm:gap-6" onSubmit={handleCredentialLogin}>
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-error-container/10 border border-error/20 text-error text-[10px] uppercase tracking-widest font-bold">
                  {error}
                </div>
              )}
              {/* Email Field */}
              <div className="group">
                <label className="font-sans text-[10px] uppercase tracking-widest text-[#00f2ff] mb-1.5 block font-bold opacity-80" htmlFor="email">
                  Network Identity (Email)
                </label>
                <div className="relative transition-all duration-300">
                  <input 
                    className="w-full bg-[#0a0a0a] border-none ring-1 ring-white/5 focus:ring-1 focus:ring-[#00f2ff]/40 text-on-surface placeholder:text-surface-bright py-4 px-5 rounded-xl transition-all outline-none" 
                    id="email" 
                    placeholder="operator@brewforce.ai" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <AtSign className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-[#00f2ff] transition-colors" />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-[#00f2ff] font-bold opacity-80" htmlFor="password">
                    Access Cipher
                  </label>
                  <a className="text-[10px] text-primary-container/80 hover:text-primary-container uppercase tracking-widest font-bold transition-colors" href="#">Recover?</a>
                </div>
                <div className="relative transition-all duration-300">
                  <input 
                    className="w-full bg-[#0a0a0a] border-none ring-1 ring-white/5 focus:ring-1 focus:ring-[#00f2ff]/40 text-on-surface placeholder:text-surface-bright py-4 px-5 rounded-xl transition-all outline-none" 
                    id="password" 
                    placeholder="••••••••••••" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within:text-[#00f2ff] transition-colors" />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button 
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container font-display font-bold py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(255,191,0,0.3)] disabled:opacity-50" 
              type="submit"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Synchronize Session</span>
                  <Zap className="w-5 h-5 fill-current" />
                </>
              )}
            </button>
          </form>

          <footer className="text-center pt-2">
            <p className="text-on-surface-variant text-sm opacity-60">
              New operator? <a className="text-primary-container font-semibold hover:underline underline-offset-4" href="#">Register Terminal</a>
            </p>
          </footer>
        </motion.section>

        {/* Technical Telemetry Footer */}
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-8 sm:mt-16 hidden sm:grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16"
        >
          <div className="flex flex-col gap-1 border-l border-primary-container/20 pl-4">
            <span className="font-sans text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold">System Status</span>
            <span className="text-xs font-mono text-[#00f2ff]">Online // Stable</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-primary-container/20 pl-4">
            <span className="font-sans text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold">Encryption</span>
            <span className="text-xs font-mono text-[#00f2ff]">AES-256-GCM</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-primary-container/20 pl-4">
            <span className="font-sans text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold">Latency</span>
            <span className="text-xs font-mono text-[#00f2ff]">14ms @ Node-09</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-primary-container/20 pl-4">
            <span className="font-sans text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold">Protocol</span>
            <span className="text-xs font-mono text-[#00f2ff]">Cyber-Barista v2.4.0</span>
          </div>
        </motion.section>
      </main>

      {/* Side Graphics */}
      <div className="fixed left-8 bottom-24 hidden lg:block overflow-hidden pointer-events-none">
        <div className="flex flex-col gap-4">
          <div className="h-24 w-px bg-gradient-to-b from-transparent via-primary-container to-transparent opacity-50"></div>
          <div className="font-sans text-[9px] uppercase vertical-text tracking-[0.5em] text-primary-container/30 h-64 flex items-center justify-center" style={{ writingMode: 'vertical-rl' }}>
            PRECISE EXTRACTION MONITORING SYSTEM
          </div>
        </div>
      </div>

      <div className="fixed right-10 top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none">
        <div className="relative w-48 h-48 border border-white/5 rounded-full flex items-center justify-center">
          <motion.div 
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 border border-primary-container/10 rounded-full"
          ></motion.div>
          <div className="w-32 h-32 border border-secondary-container/10 rounded-full flex items-center justify-center">
            <Coffee className="w-10 h-10 text-primary-container opacity-20" />
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 bg-[#131313] font-mono text-[8px] text-[#00f2ff]">CORE_TEMP: 94.2°C</div>
        </div>
      </div>
    </div>
  )
}
