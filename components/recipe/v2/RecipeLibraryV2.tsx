'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Coffee, Ghost, ArrowRight, Trash2, Copy, Edit3 } from 'lucide-react'
import { useRecipeStore } from '@/stores/RecipeStore'
import { useBrewStore } from '@/stores/BrewStore'
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

      {/* Grid Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="cyber-panel-header">Custom Formulations</div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <div style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 8, 
          background: isActive ? 'var(--cyber-amber)' : 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? '#000' : 'var(--text-tertiary)'
        }}>
          <Coffee size={16} fill={isActive ? 'currentColor' : 'none'} />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {(isHovered || isActive) && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginRight: 'var(--space-2)' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: 6, 
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className="hover-bright"
                title={recipe.id.startsWith('preset-') ? "Clone & Edit" : "Edit Formula"}
              >
                <Edit3 size={14} />
              </button>
              {onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm('Delete this formula?')) onDelete(); }}
                  style={{ 
                    background: 'rgba(255,0,0,0.05)', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: 6, 
                    color: 'rgba(255,100,100,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="hover-bright"
                  title="Delete Formula"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
          
          {recipe.aiGenerated && (
            <div style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'var(--cyber-teal)', color: '#000' }}>AI SUGGEST</div>
          )}
          <div style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--cyber-border)', color: 'var(--text-tertiary)' }}>{recipe.method.toUpperCase()}</div>
        </div>
      </div>

      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '2px' }}>{recipe.name}</h3>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>{recipe.beanOrigin || 'Blend Profile Default'}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>DOSE</div>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)' }}>{recipe.coffeeGrams}g</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>YIELD</div>
          <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)' }}>{recipe.waterGrams}g</div>
        </div>
        <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>RATIO</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)' }}>1:{recipe.ratio}</div>
        </div>
        <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>TEMP</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)' }}>{recipe.temperature}°C</div>
        </div>
      </div>

      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          style={{ position: 'absolute', bottom: -1, left: '20%', right: '20%', height: 2, background: 'var(--cyber-amber)', boxShadow: 'var(--cyber-glow-amber)' }} 
        />
      )}
    </motion.div>
  )
}
