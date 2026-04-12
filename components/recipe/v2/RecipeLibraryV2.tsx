'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Coffee, Ghost, ArrowRight, Trash2, Copy, Edit3, Share2, Check } from 'lucide-react'
import { useRecipeStore } from '@/stores/RecipeStore'
import { useBrewStore } from '@/stores/BrewStore'
import { encodeRecipeForSharing, generateRecipeSlug } from '@/utils/recipe-sharing'
import type { Recipe } from '@/types'

import styles from './RecipeLibraryV2.module.css'

import { RecipeEditorV2 } from './RecipeEditorV2'

export function RecipeLibraryV2({ onSelectSuccess }: { onSelectSuccess?: () => void }) {
  const { recipes, deleteRecipe, addRecipe, cloneRecipe, updateRecipe } = useRecipeStore()
  const { activeRecipe, setActiveRecipe } = useBrewStore()
  const [editingRecipe, setEditingRecipe] = React.useState<Recipe | null>(null)

  const custom = recipes.filter((r) => !r.id.startsWith('preset-'))
  const presets = recipes.filter((r) => r.id.startsWith('preset-'))

  const handleSelect = (r: Recipe) => {
    setActiveRecipe(r)
    onSelectSuccess?.()
  }

  const handleEdit = (r: Recipe) => {
    if (r.id.startsWith('preset-')) {
      // Clone preset before editing
      cloneRecipe(r.id).then(cloned => {
        if (cloned) setEditingRecipe(cloned)
      })
    } else {
      setEditingRecipe(r)
    }
  }

  const handleSave = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingRecipe && editingRecipe.id !== 'new') {
      updateRecipe(editingRecipe.id, recipeData)
      const updated = { ...editingRecipe, ...recipeData, updatedAt: new Date().toISOString() }
      if (activeRecipe?.id === updated.id) {
        setActiveRecipe(updated)
      }
    } else {
      addRecipe(recipeData).then(newR => {
        if (newR) setActiveRecipe(newR)
      })
    }
    setEditingRecipe(null)
  }

  const handleNewFormula = () => {
    setEditingRecipe(null) // Reset to create new
    // Open editor with empty or default 
    const defaultTemplate: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `New Formula #${custom.length + 1}`,
      method: 'v60',
      coffeeGrams: 15,
      waterGrams: 240,
      ratio: 16,
      grindSize: 'medium_fine',
      temperature: 93,
      beanOrigin: '',
      aiGenerated: false,
      stages: [
        { id: 's1', name: 'Bloom', targetWeight: 45, targetSeconds: 45, temperature: 93, notes: 'Stir gently' },
        { id: 's2', name: 'Main Pour', targetWeight: 195, targetSeconds: 60, temperature: 93 },
        { id: 's3', name: 'Drawdown', targetWeight: 0, targetSeconds: 60, temperature: 0 }
      ]
    }
    // For now, shortcut to adding it directly to show the library works, or open editor
    // Let's open editor with this template:
    setEditingRecipe({ ...defaultTemplate, id: 'new', createdAt: '', updatedAt: '' } as Recipe)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 'var(--space-1)' }}>
            Digital Library
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
             Manage and optimize your extraction parameters
          </p>
        </div>
        <button 
          onClick={handleNewFormula}
          className="btn btn-primary" 
          style={{ height: 48, padding: '0 var(--space-6)', background: 'var(--cyber-amber)', color: '#000', fontWeight: 800 }}
        >
          <Plus size={18} fill="currentColor" /> NEW FORMULA
        </button>
      </div>

      {/* Lab Insights Banner */}
      <div className="v2-glass" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-3)', 
        padding: 'var(--space-4)', 
        marginBottom: 'var(--space-6)', 
        borderLeft: '2px solid var(--cyber-amber)' 
      }}>
        <div style={{ padding: '6px', background: 'rgba(255,191,0,0.1)', borderRadius: 8, color: 'var(--cyber-amber)' }}>
          <Coffee size={16} />
        </div>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--cyber-amber)', marginRight: 'var(--space-2)' }}>
            LABORATORY INSIGHTS
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Optimized extraction protocol identified for Gesha varietals.
          </span>
        </div>
      </div>

      {/* Grid Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="cyber-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Custom Formulations</span>
        </div>
        <div className={styles.grid}>
          {custom.map((r) => (
            <RecipeV2Card 
              key={r.id} 
              recipe={r} 
              isActive={activeRecipe?.id === r.id} 
              onSelect={() => handleSelect(r)}
              onEdit={() => handleEdit(r)}
              onDelete={() => deleteRecipe(r.id)}
            />
          ))}
        </div>

        <div className="cyber-panel-header" style={{ marginTop: 'var(--space-8)' }}>System Presets</div>
        <div className={styles.grid}>
          {presets.map((r) => (
            <RecipeV2Card 
              key={r.id} 
              recipe={r} 
              isActive={activeRecipe?.id === r.id} 
              onSelect={() => handleSelect(r)}
              onEdit={() => handleEdit(r)}
            />
          ))}
        </div>
      </div>

      {/* Sidebar Editor */}
      {editingRecipe && (
        <RecipeEditorV2 
          initialRecipe={editingRecipe.id === 'new' ? null : editingRecipe}
          onSave={handleSave}
          onCancel={() => setEditingRecipe(null)}
        />
      )}
    </div>
  )
}

function RecipeV2Card({ 
  recipe, 
  isActive, 
  onSelect, 
  onEdit, 
  onDelete 
}: { 
  recipe: Recipe, 
  isActive: boolean, 
  onSelect: () => void,
  onEdit: () => void,
  onDelete?: () => void 
}) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [showCopyFeedback, setShowCopyFeedback] = React.useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = await useRecipeStore.getState().shareRecipe(recipe.id)
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        setShowCopyFeedback(true)
        setTimeout(() => setShowCopyFeedback(false), 2000)
      })
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      className="v2-glass"
      style={{
        padding: 'var(--space-5)',
        borderRadius: 'var(--radius-xl)',
        cursor: 'pointer',
        border: isActive ? '1px solid var(--cyber-amber)' : '1px solid var(--cyber-border)',
        position: 'relative',
        transition: 'border-color 0.2s ease',
        boxShadow: isActive ? '0 0 20px rgba(255, 191, 0, 0.1)' : 'none'
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {recipe.aiGenerated && (
          <div style={{ fontSize: '8px', fontWeight: 800, padding: '4px 6px', borderRadius: 4, background: 'var(--cyber-teal)', color: '#000', letterSpacing: '0.05em' }}>AI SUGGEST</div>
        )}
        <div style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', display: 'flex', flexDirection: 'column' }}>
          <span>{recipe.beanOrigin ? 'SINGLE' : 'HERITAGE'}</span>
          <span>{recipe.beanOrigin ? 'ORIGIN' : 'BLEND'}</span>
        </div>
      </div>

      <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-8)', lineHeight: 1.1 }}>{recipe.name}</h3>

      <div className="responsive-grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>DOSE</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{recipe.coffeeGrams}g</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>YIELD</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{recipe.waterGrams}g</div>
        </div>
        <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>RATIO</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>1:{recipe.ratio}</div>
        </div>
        <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>TEMP</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--cyber-teal)' }}>{recipe.temperature}°C</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['A'].map(initial => (
             <div key={initial} style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600 }}>
               {initial}
             </div>
          ))}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>LAST BREWED 1D AGO</div>
      </div>

      {/* Action Controls hidden unless hovered to keep UI clean, or place top right absolute */}
      <div style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', opacity: isHovered || isActive ? 1 : 0, transition: 'opacity 0.2s' }}>
        <button 
          onClick={handleShare}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 4, padding: 4, color: showCopyFeedback ? 'var(--cyber-teal)' : 'var(--text-tertiary)', cursor: 'pointer' }}
          title="Share Formula Link"
        >
          {showCopyFeedback ? <Check size={12} /> : <Share2 size={12} />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 4, padding: 4, color: 'var(--text-tertiary)', cursor: 'pointer' }}
          title={recipe.id.startsWith('preset-') ? "Clone & Edit" : "Edit Formula"}
        >
          <Edit3 size={12} />
        </button>
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) onDelete(); }}
            style={{ background: 'rgba(255,0,0,0.05)', border: 'none', borderRadius: 4, padding: 4, color: 'rgba(255,100,100,0.6)', cursor: 'pointer' }}
            title="Delete Formula"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: 'var(--cyber-amber)' }} 
        />
      )}
    </motion.div>

  )
}
