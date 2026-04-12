'use client'

import styles from './RecipeLibrary.module.css'
import { useRecipeStore } from '@/stores/RecipeStore'
import { useBrewStore } from '@/stores/BrewStore'
import type { Recipe, BrewMethod } from '@/types'
import { useState, useCallback } from 'react'
import { RecipeEditor } from './RecipeEditor'

const METHOD_LABELS: Record<BrewMethod, string> = {
  v60: 'V60',
  aeropress: 'AeroPress',
  french_press: 'French Press',
  chemex: 'Chemex',
  kalita: 'Kalita',
  custom: 'Custom',
}

const METHOD_ICONS: Record<BrewMethod, string> = {
  v60: '🫗',
  aeropress: '⬆️',
  french_press: '☕',
  chemex: '⚗️',
  kalita: '🌊',
  custom: '⚙️',
}

interface RecipeCardProps {
  recipe: Recipe
  isActive: boolean
  onSelect: (r: Recipe) => void
  onDelete: (id: string) => void
  onClone: (id: string) => void
  onEdit: (r: Recipe) => void
  onShare: (id: string) => Promise<void>
}

function RecipeCard({ recipe, isActive, onSelect, onDelete, onClone, onEdit, onShare }: RecipeCardProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [justShared, setJustShared] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSharing(true)
    await onShare(recipe.id)
    setIsSharing(false)
    setJustShared(true)
    setTimeout(() => setJustShared(false), 2000)
  }
  return (
    <div
      className={`${styles.card} ${isActive ? styles.activeCard : ''}`}
      onClick={() => onSelect(recipe)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(recipe)}
    >
      <div className={styles.cardHeader}>
        <span className={styles.methodIcon}>{METHOD_ICONS[recipe.method]}</span>
        <div className={styles.cardMeta}>
          <div className="badge badge-info" style={{ fontSize: '0.6rem' }}>
            {METHOD_LABELS[recipe.method]}
          </div>
          {recipe.aiGenerated && (
            <div className="badge badge-accent" style={{ fontSize: '0.6rem' }}>✨ AI</div>
          )}
        </div>
      </div>

      <h3 className={styles.cardName}>{recipe.name}</h3>

      {recipe.beanOrigin && (
        <p className={styles.cardOrigin}>{recipe.beanOrigin}</p>
      )}

      <div className={styles.cardStats}>
        <div className={styles.cardStat}>
          <span className={styles.statVal}>{recipe.coffeeGrams}g</span>
          <span className={styles.statKey}>Coffee</span>
        </div>
        <div className={styles.cardDivider} />
        <div className={styles.cardStat}>
          <span className={styles.statVal}>{recipe.waterGrams}g</span>
          <span className={styles.statKey}>Water</span>
        </div>
        <div className={styles.cardDivider} />
        <div className={styles.cardStat}>
          <span className={styles.statVal}>{recipe.temperature}°</span>
          <span className={styles.statKey}>Temp</span>
        </div>
        <div className={styles.cardDivider} />
        <div className={styles.cardStat}>
          <span className={styles.statVal}>1:{recipe.ratio}</span>
          <span className={styles.statKey}>Ratio</span>
        </div>
      </div>

      {isActive && (
        <div className={styles.activeIndicator}>
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          Active Recipe
        </div>
      )}

      {!isActive && (
        <div className={styles.cardActions}>
          <button
            className="btn btn-sm btn-ghost"
            onClick={(e) => { e.stopPropagation(); onClone(recipe.id) }}
          >
            Clone
          </button>
          {!recipe.id.startsWith('preset-') && (
            <>
              <button
                className="btn btn-sm btn-ghost"
                onClick={(e) => { e.stopPropagation(); onEdit(recipe) }}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleShare}
                disabled={isSharing}
                style={{ color: justShared ? 'var(--cyber-teal, #00e5cc)' : undefined }}
                title="Share recipe link"
              >
                {isSharing ? '...' : justShared ? 'Copied!' : 'Share'}
              </button>
              <button
                className={`btn btn-sm btn-ghost ${styles.deleteBtn}`}
                onClick={(e) => { e.stopPropagation(); onDelete(recipe.id) }}
                aria-label="Delete recipe"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

interface RecipeLibraryProps {
  onSelectSuccess?: () => void
}

export function RecipeLibrary({ onSelectSuccess }: RecipeLibraryProps) {
  const { recipes, deleteRecipe, cloneRecipe, addRecipe, updateRecipe, shareRecipe } = useRecipeStore()
  const { activeRecipe, setActiveRecipe } = useBrewStore()
  const [editorState, setEditorState] = useState<{ open: boolean, recipe: Recipe | null }>({
    open: false,
    recipe: null
  })

  const handleShare = useCallback(async (id: string) => {
    await shareRecipe(id)
  }, [shareRecipe])

  const handleSelect = (recipe: Recipe) => {
    setActiveRecipe(recipe)
    if (onSelectSuccess) {
      onSelectSuccess()
    }
  }

  const presets = recipes.filter((r) => r.id.startsWith('preset-'))
  const custom = recipes.filter((r) => !r.id.startsWith('preset-'))

  const handleSave = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editorState.recipe) {
      updateRecipe(editorState.recipe.id, recipeData)
      const savedRecipe = { ...editorState.recipe, ...recipeData, updatedAt: new Date().toISOString() }
      
      // Sync with BrewStore if this is the active recipe
      if (activeRecipe?.id === savedRecipe.id) {
        setActiveRecipe(savedRecipe)
      }
    } else {
      await addRecipe(recipeData as any)
    }
    setEditorState({ open: false, recipe: null })
  }

  return (
    <section className={styles.library}>
      <div className={styles.header}>
        <div className={styles.headerTitles}>
          <h2 className={styles.title}>Recipe Library</h2>
          <span className={styles.count}>{recipes.length} recipes</span>
        </div>
        <button 
          className={`btn btn-primary ${styles.createBtn}`}
          onClick={() => setEditorState({ open: true, recipe: null })}
        >
          + Create Recipe
        </button>
      </div>

      {custom.length > 0 && (
        <div className={styles.group}>
          <div className={styles.groupLabel}>Your Recipes</div>
          <div className={styles.grid}>
            {custom.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                isActive={activeRecipe?.id === r.id}
                onSelect={handleSelect}
                onDelete={deleteRecipe}
                onClone={cloneRecipe}
                onEdit={(recipe) => setEditorState({ open: true, recipe })}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.group}>
        <div className={styles.groupLabel}>Standard Presets</div>
        <div className={styles.grid}>
          {presets.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                isActive={activeRecipe?.id === r.id}
                onSelect={handleSelect}
                onDelete={deleteRecipe}
                onClone={cloneRecipe}
                onEdit={(recipe) => setEditorState({ open: true, recipe })}
                onShare={handleShare}
              />
            ))}
        </div>
      </div>

      {editorState.open && (
        <RecipeEditor 
          initialRecipe={editorState.recipe}
          onSave={handleSave}
          onCancel={() => setEditorState({ open: false, recipe: null })}
        />
      )}
    </section>
  )
}
