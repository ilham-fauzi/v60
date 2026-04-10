'use client'

import { useState, useEffect } from 'react'
import { useBrewStore } from '@/stores/BrewStore'
import { useRecipeStore } from '@/stores/RecipeStore'
import dynamic from 'next/dynamic'
import { DesktopLayout } from '@/components/layout/v2/DesktopLayout'
import { DashboardSkeleton } from '@/components/brew/v2/BrewDashboardV2'
const BrewDashboardV2 = dynamic(() => import('@/components/brew/v2/BrewDashboardV2').then(mod => mod.BrewDashboardV2), { 
  ssr: false,
  loading: () => <DashboardSkeleton />
})
import { RecipeLibraryV2 } from '@/components/recipe/v2/RecipeLibraryV2'
import { PostBrewJournal } from '@/components/journal/PostBrewJournal'
import { Search, Coffee, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Home() {
  const [activeTab, setActiveTab] = useState('brew')
  const [searchQuery, setSearchQuery] = useState('')
  const { isFocusMode, toggleFocusMode, activeRecipe, setActiveRecipe, tare } = useBrewStore()
  const { initRecipes, recipes } = useRecipeStore()

  // Initialize Data from SQLite
  useEffect(() => {
    initRecipes()
  }, [initRecipes])

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

  const FormulaDatabase = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-4)' }}>
      <div className="cyber-panel-header">Formula Database</div>
      
      {/* Search Header */}
      <div className="v2-glass" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Search size={14} color="var(--text-tertiary)" />
        <input 
          type="text" 
          placeholder="Filter formulas..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#fff', 
            fontSize: 'var(--text-xs)', 
            width: '100%',
            outline: 'none'
          }} 
        />
      </div>

      {/* Scrollable List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-3)',
        paddingRight: 'var(--space-2)',
        maxHeight: 'calc(100vh - 280px)' // Responsive height for sidebar
      }} className="hide-scrollbar">
        {filteredRecipes.map((r) => {
          const isActive = activeRecipe?.id === r.id
          return (
            <motion.div
              key={r.id}
              whileHover={{ x: 4 }}
              onClick={() => {
                setActiveRecipe(r)
                if (activeTab !== 'brew') setActiveTab('brew')
              }}
              className="v2-glass"
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                border: isActive ? '1px solid var(--cyber-amber)' : '1px solid var(--cyber-border)',
                background: isActive ? 'rgba(255, 191, 0, 0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: isActive ? 'var(--cyber-amber)' : 'var(--text-primary)' }}>
                  {r.name}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-tertiary)' }}>
                  {r.method.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-1)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                <span>{r.coffeeGrams}g</span>
                <span>•</span>
                <span>1:{r.ratio}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* System Stats Block */}
      <div className="v2-glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', marginTop: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cyber-teal)', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Zap size={10} /> [NODE] KINETIC_STABLE
          </div>
          <div>[IO] SCALE_STREAM_CONNECTED</div>
        </div>
      </div>
    </div>
  )

  return (
    <DesktopLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      rightContent={FormulaDatabase}
      isFocusMode={isFocusMode}
    >
      {/* Primary Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {activeTab === 'brew' && <BrewDashboardV2 recipe={activeRecipe} />}
        {activeTab === 'recipes' && (
          <RecipeLibraryV2 onSelectSuccess={() => setActiveTab('brew')} />
        )}
        
        {activeTab === 'history' && (
          <div className="v2-glass" style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)' }}>
            <PostBrewJournal />
          </div>
        )}
      </div>
    </DesktopLayout>
  )
}
