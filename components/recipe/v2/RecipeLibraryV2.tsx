'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Coffee, Ghost, ArrowRight, Trash2, Copy, Edit3, Share2, Check, FlaskConical, Star, PlayCircle, Edit, Shield, RefreshCw } from 'lucide-react'
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
    const defaultTemplate: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `New Formula #${custom.length + 1}`,
      method: 'v60',
      coffeeGrams: 15,
      waterGrams: 240,
      iceGrams: 0,
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
    setEditingRecipe({ ...defaultTemplate, id: 'new', createdAt: '', updatedAt: '' } as Recipe)
  }

  const featuredRecipe = presets[0] || recipes[0]

  return (
    <div className={styles.container} style={{ perspective: '1000px' }}>
      {/* Featured Recipe Hero */}
      {featuredRecipe && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group mb-8"
        >
          <div className="relative overflow-hidden rounded-[1.5rem] h-[240px] md:h-[280px] bg-surface-container-lowest shadow-[0_16px_32px_rgba(255,191,0,0.06)] border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-transparent to-transparent z-10" />
            <img 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-all duration-1000 group-hover:scale-105" 
              alt="Cinematic coffee brewing"
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=2000"
            />
            
            <div className="absolute bottom-6 left-6 z-20 space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-[8px] font-black uppercase tracking-widest rounded">
                  Masterwork
                </span>
                <div className="flex items-center gap-1 text-[#00f2ff]">
                  <Star size={10} fill="currentColor" />
                  <span className="text-xs font-bold">4.9 precision</span>
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-[-0.05em] text-on-background uppercase leading-[0.85]">
                {featuredRecipe.name}
              </h2>
              
              <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed max-w-md font-medium opacity-80 line-clamp-2">
                A molecular reconstruction of traditional {featuredRecipe.method} extraction. 
                Synchronized at {featuredRecipe.temperature}°C.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => handleSelect(featuredRecipe)}
                  className="px-8 py-3.5 bg-secondary-container/10 backdrop-blur-md text-secondary-container border border-secondary-container/30 font-display uppercase text-xs font-black tracking-[0.2em] rounded-xl transition-all hover:bg-secondary-container hover:text-on-secondary active:scale-95 flex items-center gap-2"
                >
                  <FlaskConical size={16} />
                  Initiate Extraction
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Community Library Section */}
      <section className="space-y-4 mb-10">
        <div className="flex justify-between items-end border-b border-white/5 pb-2">
          <div>
            <span className="text-[9px] font-display uppercase tracking-[0.2em] text-[#00f2ff] font-bold">Library</span>
            <h3 className="text-xl font-display font-black text-on-background uppercase tracking-tight">Community</h3>
          </div>
          <button 
            onClick={handleNewFormula}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary-container text-[9px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus size={12} /> NEW FORMULA
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.slice(0, 6).map((r) => (
            <RecipeV2Card 
              key={r.id} 
              recipe={r} 
              isActive={activeRecipe?.id === r.id} 
              onSelect={() => handleSelect(r)}
              onEdit={() => handleEdit(r)}
            />
          ))}
        </div>
      </section>

      {/* Alchemy Vault Section (List View) */}
      <section className="space-y-4">
        <div className="flex justify-between items-end border-b border-white/5 pb-2">
          <div>
            <span className="text-[9px] font-display uppercase tracking-[0.2em] text-primary-container font-bold">Vault</span>
            <h3 className="text-xl font-display font-black text-on-background uppercase tracking-tight">My Formulas</h3>
          </div>
          <div className="flex items-center gap-1.5 text-primary-container/80 font-display text-[9px] uppercase tracking-widest font-black">
            <Shield size={10} />
            Secure
          </div>
        </div>

        <div className="space-y-2">
          {custom.map((r) => (
            <div 
              key={r.id}
              onClick={() => handleSelect(r)}
              className="flex items-center justify-between p-3 bg-surface-container-low/40 hover:bg-surface-container-high/60 transition-all duration-300 group rounded-xl border border-white/5 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-primary-container ring-1 ring-white/5 shadow-inner">
                  <FlaskConical size={18} />
                </div>
                <div>
                  <h5 className="text-on-surface font-display font-bold text-sm uppercase tracking-tight group-hover:text-primary-container transition-colors">{r.name}</h5>
                  <div className="flex items-center gap-2">
                    <p className="text-[8px] text-on-surface-variant uppercase tracking-widest font-bold opacity-60">{r.method.toUpperCase()}</p>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    <p className="text-[8px] text-primary-container uppercase tracking-widest font-bold">1:{r.ratio}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="hidden lg:flex flex-col items-end gap-1">
                  <span className="text-xs text-[#00f2ff] font-mono font-bold tracking-tighter">1:{r.ratio} RATIO</span>
                  <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest opacity-40">{r.temperature}°C THERMALS</span>
                </div>
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                    className="p-2 text-on-surface-variant hover:text-primary-container transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSelect(r); }}
                    className="p-2 text-on-surface-variant hover:text-[#00f2ff] transition-colors"
                  >
                    <PlayCircle size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('Erase formula?')) deleteRecipe(r.id); }}
                    className="p-2 text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center pt-8">
            <button className="flex items-center gap-3 px-10 py-4 border border-white/5 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all group">
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700 text-primary-container" />
              <span className="text-[10px] font-display font-black uppercase tracking-[0.2em]">Synchronize Encrypted Vault...</span>
            </button>
          </div>
        </div>
      </section>

      {/* Editor Overlay */}
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
      className="bg-[rgba(32,31,31,0.6)] backdrop-blur-[20px] rounded-2xl border border-white/5 overflow-hidden group hover:border-[#ffe2ab]/30 transition-all duration-300"
      style={{
        cursor: 'pointer',
        border: isActive ? '1px solid var(--cyber-amber)' : '1px solid rgba(255,255,255,0.05)',
        boxShadow: isActive ? '0 0 30px rgba(255, 191, 0, 0.1)' : 'none'
      }}
    >
      <div className="h-28 relative overflow-hidden">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" 
          alt={recipe.name} 
          src="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=1000"
        />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-secondary-container font-black">
          RATIO 1:{recipe.ratio}
        </div>
        {recipe.aiGenerated && (
          <div className="absolute top-4 left-4 bg-primary-container text-on-primary-container px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest">
            AI OPTIMIZED
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-display font-black text-on-surface uppercase tracking-tight leading-none group-hover:text-primary-container transition-colors">
            {recipe.name}
          </h4>
          <div className="flex items-center gap-1 text-primary-container">
            <Star size={8} fill="currentColor" />
            <span className="text-[8px] font-black">4.8</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[7px] text-on-surface-variant font-display uppercase tracking-widest font-black opacity-60">
          <span>{recipe.method}</span>
          <span className="w-1 h-1 bg-white/10 rounded-full" />
          <span>{recipe.coffeeGrams}g / {recipe.waterGrams}g</span>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-white/5 flex items-center justify-center">
              <FlaskConical size={7} className="text-primary-container" />
            </div>
            <span className="text-[7px] text-on-surface-variant font-bold uppercase tracking-widest opacity-40">0xBrew</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="p-1.5 text-on-surface-variant hover:text-primary-container transition-colors"
            >
              {showCopyFeedback ? <Check size={14} /> : <Share2 size={14} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-on-surface-variant hover:text-primary-container transition-colors"
            >
              <Edit3 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
