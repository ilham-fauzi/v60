'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Coffee, Download, ArrowRight, Share2 } from 'lucide-react'
import { decrypt, hashToken } from '@/lib/crypto'
import { loadSharedCache, saveSharedCache } from '@/lib/storage'
import { reshareRecipe } from '@/lib/share'
import { useBrewStore } from '@/stores/BrewStore'
import { useRecipeStore } from '@/stores/RecipeStore'
import type { Recipe } from '@/types'

type PageState = 'loading' | 'loaded' | 'not_found' | 'expired'

export default function SharedRecipePage() {
  const { slug } = useParams()
  const router = useRouter()

  const nanoId = Array.isArray(slug) ? slug[0] : (slug as string)

  const { setActiveRecipe } = useBrewStore()
  const { addLocalRecipe } = useRecipeStore()

  const [state, setState] = useState<PageState>('loading')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [shareChain, setShareChain] = useState<string[]>([])
  const [isImported, setIsImported] = useState(false)
  const [isResharing, setIsResharing] = useState(false)

  const loadRecipe = useCallback(async () => {
    if (!nanoId) { setState('not_found'); return }

    // Step 1: Check localStorage cache first
    const cached = await loadSharedCache(nanoId)
    if (cached) {
      setRecipe(cached.data)
      setShareChain(cached.shareChain)
      setActiveRecipe(cached.data)
      setState('loaded')
      return
    }

    // Step 2: Fetch from SQLite via API (send hashed token)
    try {
      const hashedToken = await hashToken(nanoId)
      const res = await fetch(`/api/share/${hashedToken}`)

      if (res.status === 404) { setState('not_found'); return }
      if (res.status === 410) { setState('expired'); return }
      if (!res.ok) { setState('not_found'); return }

      const json = await res.json()

      // Decrypt client-side using the nanoId from URL as key
      const decrypted = await decrypt<Recipe>(json.data, nanoId)
      if (!decrypted) { setState('not_found'); return }

      const chain: string[] = json.share_chain ?? []

      // Cache in recipient's localStorage (no TTL, user manages)
      await saveSharedCache({
        token: nanoId,
        shareChain: chain,
        savedAt: Date.now(),
        data: decrypted,
      })

      setRecipe(decrypted)
      setShareChain(chain)
      setActiveRecipe(decrypted)
      setState('loaded')
    } catch {
      setState('not_found')
    }
  }, [nanoId, setActiveRecipe])

  useEffect(() => {
    loadRecipe()
  }, [loadRecipe])

  const handleSaveToLibrary = () => {
    if (recipe) {
      addLocalRecipe(recipe)
      setIsImported(true)
    }
  }

  const handleBrewNow = () => {
    if (recipe) {
      setActiveRecipe(recipe)
      router.push('/')
    }
  }

  const handleReshare = async () => {
    if (!recipe) return
    setIsResharing(true)
    try {
      await reshareRecipe(recipe, shareChain, nanoId)
    } finally {
      setIsResharing(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)'
    }}>
      <div className="v2-glass" style={{
        maxWidth: 480,
        width: '100%',
        padding: 'var(--space-10)',
        borderRadius: 'var(--radius-2xl)',
        textAlign: 'center',
        border: '1px solid var(--cyber-border)'
      }}>
        <AnimatePresence mode="wait">

          {/* Loading */}
          {state === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,191,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--space-6)', color: 'var(--cyber-amber)'
              }}>
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, marginBottom: 'var(--space-2)' }}>
                Loading Formula...
              </h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                Decrypting brew data...
              </p>
            </motion.div>
          )}

          {/* Loaded */}
          {state === 'loaded' && recipe && (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,191,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--space-6)', color: 'var(--cyber-amber)'
              }}>
                <Coffee size={32} />
              </div>

              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, marginBottom: 'var(--space-2)' }}>
                {recipe.name}
              </h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                {recipe.method?.toUpperCase()} · {recipe.beanOrigin || 'Shared Formula'}
              </p>

              {/* Recipe stats */}
              <div style={{
                padding: 'var(--space-4)',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-lg)',
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 'var(--space-4)', marginBottom: 'var(--space-6)'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>DOSE</div>
                  <div style={{ fontWeight: 800 }}>{recipe.coffeeGrams}g</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>YIELD</div>
                  <div style={{ fontWeight: 800 }}>{recipe.waterGrams}g</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>TEMP</div>
                  <div style={{ fontWeight: 800 }}>{recipe.temperature}°C</div>
                </div>
              </div>

              {/* Share chain indicator */}
              {shareChain.length > 1 && (
                <div style={{
                  fontSize: '10px', color: 'var(--text-tertiary)',
                  marginBottom: 'var(--space-4)',
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  🔗 Shared {shareChain.length - 1}× from original
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    onClick={handleSaveToLibrary}
                    disabled={isImported}
                    className="btn"
                    style={{
                      flex: 1,
                      background: isImported ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                      color: isImported ? 'var(--cyber-teal)' : '#fff',
                      border: '1px solid var(--cyber-border)',
                      height: 48, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)'
                    }}
                  >
                    <Download size={16} />
                    {isImported ? 'SAVED' : 'SAVE'}
                  </button>

                  <button
                    onClick={handleBrewNow}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'var(--cyber-amber)', color: '#000',
                      height: 48, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)'
                    }}
                  >
                    BREW NOW <ArrowRight size={16} />
                  </button>
                </div>

                {/* Re-share button */}
                <button
                  onClick={handleReshare}
                  disabled={isResharing}
                  className="btn"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--cyber-border)',
                    height: 40, fontWeight: 600, fontSize: 'var(--text-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)'
                  }}
                >
                  {isResharing
                    ? <><Loader2 size={14} className="animate-spin" /> COPYING LINK...</>
                    : <><Share2 size={14} /> SHARE THIS FORMULA</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* Not found */}
          {state === 'not_found' && (
            <motion.div key="not_found" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <AlertCircle size={48} style={{ color: '#ff4444', marginBottom: 'var(--space-4)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                Link Not Found
              </h2>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-8)' }}>
                This formula is unavailable. Please request a new link from the recipe creator.
              </p>
              <button onClick={() => router.push('/')} className="btn btn-primary" style={{ width: '100%' }}>
                RETURN TO DASHBOARD
              </button>
            </motion.div>
          )}

          {/* Expired */}
          {state === 'expired' && (
            <motion.div key="expired" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <AlertCircle size={48} style={{ color: 'var(--cyber-amber)', marginBottom: 'var(--space-4)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                Link Expired
              </h2>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-8)' }}>
                This link has expired (3 days limit). Please request a new link from the recipe creator.
              </p>
              <button onClick={() => router.push('/')} className="btn btn-primary" style={{ width: '100%' }}>
                RETURN TO DASHBOARD
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
