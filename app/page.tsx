'use client'

import { useState, useEffect } from 'react'
import { useBrewStore } from '@/stores/BrewStore'
import { useRecipeStore } from '@/stores/RecipeStore'
import { useJournalStore } from '@/stores/JournalStore'
import { useMetricStore } from '@/stores/MetricStore'
import dynamic from 'next/dynamic'
import { DesktopLayout } from '@/components/layout/v2/DesktopLayout'
import { DashboardSkeleton } from '@/components/brew/v2/BrewDashboardV2'
const BrewDashboardV2 = dynamic(() => import('@/components/brew/v2/BrewDashboardV2').then(mod => mod.BrewDashboardV2), { 
  ssr: false,
  loading: () => <DashboardSkeleton />
})
import { RecipeLibraryV2 } from '@/components/recipe/v2/RecipeLibraryV2'
import { PostBrewJournal } from '@/components/journal/PostBrewJournal'
import { Search, Coffee, Zap, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Home() {
  const [activeTab, setActiveTab] = useState('brew')
  const [searchQuery, setSearchQuery] = useState('')
  const { isFocusMode, toggleFocusMode, activeRecipe, setActiveRecipe, tare } = useBrewStore()
  const { initRecipes, recipes } = useRecipeStore()
  const { totalRecipes, totalBrews, favoriteOrigin, avgRating, initMetrics } = useMetricStore()
  const initLogs = useJournalStore(s => s.initLogs)

  // 1. Initial Data Fetch (Runs once on mount)
  useEffect(() => {
    initRecipes()
    initMetrics()
  }, [initRecipes, initMetrics])

  // 2. Sync Logs once Recipes are loaded (Depends on recipes reference)
  useEffect(() => {
    if (recipes.length > 0) {
      initLogs(recipes)
    }
  }, [recipes, initLogs])

  // Port Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key.toLowerCase()
      if (key === 'f') {
        e.preventDefault()
        toggleFocusMode()
      }
      if (key === 't') {
        e.preventDefault()
        tare()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFocusMode, tare])

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.method.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Intelligence Right Side Panels
  const BrewIntelligence = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-6)' }}>
      <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--cyber-teal)' }}>
        INTELLIGENCE<br/>
        <span style={{ color: 'var(--text-tertiary)' }}>AI SENSOR CORE</span>
      </div>
      
      <div className="v2-glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--cyber-teal)', fontSize: '10px', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          <Zap size={14} /> PREDICTION
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
          "Flow rate is 0.4g/s above target. Recommend reducing pour intensity to maintain extraction balance."
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--cyber-border)', fontSize: '10px', fontWeight: 700 }}>
          <span style={{ color: 'var(--text-secondary)' }}>BREW SESSIONS</span>
          <span style={{ color: 'var(--cyber-teal)' }}>{totalBrews}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--cyber-border)', fontSize: '10px', fontWeight: 700 }}>
          <span style={{ color: 'var(--text-secondary)' }}>AVG RATING</span>
          <span style={{ color: '#ffb084' }}>{avgRating.toFixed(1)}/5.0</span>
        </div>
      </div>

      <button className="btn btn-ghost" style={{ width: '100%', marginTop: 'auto', border: '1px solid var(--cyber-border)', color: 'var(--cyber-teal)', fontSize: '10px', letterSpacing: '0.1em' }}>
        SEARCH DATABASE
      </button>
    </div>
  )

  const RecipesIntelligence = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-6)' }}>
      <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
        INTELLIGENCE<br/>
        <span style={{ color: 'var(--cyber-teal)' }}>AI SENSOR CORE</span>
      </div>

      <div className="v2-glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'rgba(0, 242, 255, 0.05)' }}>
        <Zap size={14} color="var(--cyber-teal)" />
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--cyber-teal)' }}>Formula Lookup</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0 var(--space-4)' }}>
        <Coffee size={14} color="var(--text-tertiary)" />
        <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-secondary)' }}>Telemetry</span>
      </div>

      <div className="v2-glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-4)' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>
          EXTRACTION PREDICTION
        </div>
        
        {/* Placeholder Chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', marginBottom: 'var(--space-4)' }}>
          <div style={{ width: '15%', height: '40%', background: 'rgba(0, 242, 255, 0.3)' }} />
          <div style={{ width: '15%', height: '60%', background: 'rgba(0, 242, 255, 0.5)' }} />
          <div style={{ width: '15%', height: '80%', background: 'rgba(0, 242, 255, 0.7)' }} />
          <div style={{ width: '15%', height: '100%', background: 'var(--cyber-amber)', boxShadow: 'var(--cyber-glow-amber)' }} />
          <div style={{ width: '15%', height: '50%', background: 'rgba(0, 242, 255, 0.4)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)' }}>
          <span>Total Recipes</span>
          <span style={{ color: 'var(--cyber-teal)' }}>{totalRecipes} ACTIVE</span>
        </div>
      </div>

      <button className="btn btn-ghost" style={{ width: '100%', marginTop: 'auto', border: '1px solid var(--cyber-border)', color: 'var(--cyber-teal)', fontSize: '10px', letterSpacing: '0.1em' }}>
        SEARCH DATABASE
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
        <Settings size={12} /> Diagnostics
      </div>
    </div>
  )

  const HistoryIntelligence = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-6)' }}>
      <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--cyber-teal)' }}>
        INTELLIGENCE<br/>
        <span style={{ color: 'var(--text-tertiary)' }}>AI SENSOR CORE</span>
      </div>

      <div className="v2-glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'rgba(0, 242, 255, 0.05)' }}>
        <Zap size={14} color="var(--cyber-teal)" />
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--cyber-teal)' }}>FORMULA LOOKUP</span>
      </div>

      <div style={{ padding: '0 var(--space-2)' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Your profile is strongest with {favoriteOrigin} coffee. Maintaining an average rating of {avgRating.toFixed(1)} across {totalBrews} sessions.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
        <Coffee size={14} color="var(--text-tertiary)" />
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>TELEMETRY</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: '0 var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>GLOBAL RATING</span>
            <span style={{ fontWeight: 600 }}>{(avgRating / 5 * 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
            <div style={{ width: `${(avgRating / 5 * 100)}%`, height: '100%', background: 'var(--cyber-teal)', borderRadius: 2 }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 'var(--space-2)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>LIBRARY COVERAGE</span>
            <span style={{ fontWeight: 600, color: '#22c55e' }}>{totalRecipes > 0 ? 'ACTIVE' : 'NONE'}</span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
            <div style={{ width: totalRecipes > 0 ? '100%' : '0%', height: '100%', background: '#22c55e', borderRadius: 2 }} />
          </div>
        </div>
      </div>

      <button className="btn btn-ghost" style={{ width: '100%', marginTop: 'auto', border: '1px solid var(--cyber-border)', color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.1em', fontWeight: 700 }}>
        SEARCH DATABASE
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
          <Settings size={12} /> DIAGNOSTICS
        </div>
      </div>
    </div>
  )

  const activeRightContent = activeTab === 'brew' ? BrewIntelligence : 
                             activeTab === 'recipes' ? RecipesIntelligence : 
                             HistoryIntelligence;

  return (
    <DesktopLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      rightContent={activeRightContent}
      isFocusMode={isFocusMode}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {activeTab === 'brew' && <BrewDashboardV2 recipe={activeRecipe} />}
        {activeTab === 'recipes' && (
          <RecipeLibraryV2 onSelectSuccess={() => setActiveTab('brew')} />
        )}
        
        {activeTab === 'history' && (
          <div style={{ width: '100%' }}>
            <PostBrewJournal />
          </div>
        )}
      </div>
    </DesktopLayout>
  )
}
