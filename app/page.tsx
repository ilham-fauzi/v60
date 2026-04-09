'use client'

import { useState, useEffect } from 'react'
import { useBrewStore } from '@/stores/BrewStore'
import { useRecipeStore } from '@/stores/RecipeStore'
import { DesktopLayout } from '@/components/layout/v2/DesktopLayout'
import { BrewDashboardV2 } from '@/components/brew/v2/BrewDashboardV2'
import { RecipeLibraryV2 } from '@/components/recipe/v2/RecipeLibraryV2'
import { RadarFlavorChart } from '@/components/viz/RadarFlavorChart'
import { AIInsightPanel } from '@/components/ai/AIInsightPanel'
import { PostBrewJournal } from '@/components/journal/PostBrewJournal'

export default function Home() {
  const [activeTab, setActiveTab] = useState('brew')
  const { isFocusMode, toggleFocusMode, activeRecipe, tare } = useBrewStore()
  const { initRecipes } = useRecipeStore()

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

  const IntelligencePanel = (
    <>
      <RadarFlavorChart />
      <div style={{ marginTop: 'var(--space-6)' }}>
        <div className="cyber-panel-header">AI Intelligence</div>
        <div className="v2-glass" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <AIInsightPanel />
        </div>
      </div>
    </>
  )

  return (
    <DesktopLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      rightContent={IntelligencePanel}
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
        
        {/* Placeholder for AI Tab if needed, though it's now in the side panel */}
        {activeTab === 'ai' && (
          <div className="v2-glass" style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)' }}>
            <AIInsightPanel />
          </div>
        )}

        {/* Telemetry Footer Block */}
        <div className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)' }}>
          <div className="cyber-panel-header">System Diagnostics</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyber-teal)', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <div>[STATUS] KINETIC ENGINE STABLE</div>
            <div>[IO] SCALE_STREAM_ACTIVE</div>
            <div>[AI] NEURAL_BRIDGE_READY</div>
          </div>
        </div>
      </div>
    </DesktopLayout>
  )
}
