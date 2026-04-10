'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Coffee, Download, ArrowRight } from 'lucide-react'
import { decodeRecipeFromSharing } from '@/utils/recipe-sharing'
import { useBrewStore } from '@/stores/BrewStore'
import { useRecipeStore } from '@/stores/RecipeStore'
import type { Recipe } from '@/types'

export default function SharedRecipePage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const data = searchParams.get('r')
  
  const { setActiveRecipe } = useBrewStore()
  const { addLocalRecipe } = useRecipeStore()
  
  const [recipe, setRecipe] = useState<Partial<Recipe> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImported, setIsImported] = useState(false)

  useEffect(() => {
    if (!data) {
      setError('Invalid share link: Missing recipe data.')
      return
    }

    const decoded = decodeRecipeFromSharing(data as string)
    if (decoded) {
      // Create a full recipe object for the store
      const fullRecipe: Recipe = {
        id: `shared-${Date.now()}`,
        name: decoded.name || 'Shared Recipe',
        method: decoded.method || 'v60',
        coffeeGrams: decoded.coffeeGrams || 15,
        waterGrams: decoded.waterGrams || 225,
        ratio: decoded.ratio || 15,
        temperature: decoded.temperature || 93,
        grindSize: decoded.grindSize || 'medium',
        beanOrigin: decoded.beanOrigin || '',
        aiGenerated: false,
        stages: decoded.stages || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setRecipe(fullRecipe)
      setActiveRecipe(fullRecipe)
      
      // Auto-redirect to dashboard after a short delay to show "Loading"
      const timer = setTimeout(() => {
        router.push('/')
      }, 2500)
      
      return () => clearTimeout(timer)
    } else {
      setError('Failed to decode recipe data. The link might be corrupted.')
    }
  }, [data, setActiveRecipe, router])

  const handleManualImport = () => {
    if (recipe) {
      addLocalRecipe(recipe as Recipe)
      setIsImported(true)
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
          {!error && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'rgba(255,191,0,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto var(--space-6)',
                color: 'var(--cyber-amber)'
              }}>
                <Coffee size={32} />
              </div>

              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, marginBottom: 'var(--space-2)' }}>
                {recipe?.name || 'Loading Shared Formula...'}
              </h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
                Syncing with Kinetic Extraction Engine...
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-4)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>DOSE</div>
                    <div style={{ fontWeight: 800 }}>{recipe?.coffeeGrams}g</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>YIELD</div>
                    <div style={{ fontWeight: 800 }}>{recipe?.waterGrams}g</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button 
                    onClick={handleManualImport}
                    disabled={isImported}
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      background: isImported ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                      color: isImported ? 'var(--cyber-teal)' : '#fff',
                      border: '1px solid var(--cyber-border)',
                      height: 48,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)'
                    }}
                  >
                    {isImported ? <><Download size={16} /> SAVED</> : <><Download size={16} /> SAVE TO LIBRARY</>}
                  </button>
                  <button 
                    onClick={() => router.push('/')}
                    className="btn" 
                    style={{ 
                      flex: 1, 
                      background: 'var(--cyber-amber)',
                      color: '#000',
                      height: 48,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--space-2)'
                    }}
                  >
                    BREW NOW <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--cyber-amber)' }} />
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--cyber-amber)' }}>
                  INITIALIZING SEQUENCE
                </span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ color: '#ff4444' }}
            >
              <AlertCircle size={48} style={{ marginBottom: 'var(--space-4)' }} />
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 'var(--space-2)', color: '#fff' }}>
                Share Error
              </h2>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-8)' }}>
                {error}
              </p>
              <button 
                onClick={() => router.push('/')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                RETURN TO DASHBOARD
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
