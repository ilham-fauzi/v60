'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, Zap, Info, Thermometer, Droplets, Scale, Timer } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe, BrewMethod, GrindSize, BrewStage } from '@/types'
import styles from './RecipeEditorV2.module.css'

interface Props {
  initialRecipe: Recipe | null
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const DEFAULT_STAGES: Omit<BrewStage, 'id'>[] = [
  { name: 'Bloom', targetWeight: 45, targetSeconds: 45, temperature: 93, notes: 'Saturate all grounds gently' },
  { name: 'Main Pour', targetWeight: 195, targetSeconds: 60, temperature: 93 },
  { name: 'Drawdown', targetWeight: 0, targetSeconds: 60, temperature: 0 },
]

export function RecipeEditorV2({ initialRecipe, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialRecipe?.name || '')
  const [method, setMethod] = useState<BrewMethod>(initialRecipe?.method || 'v60')
  const [coffeeGrams, setCoffeeGrams] = useState(initialRecipe?.coffeeGrams || 15)
  const [waterGrams, setWaterGrams] = useState(initialRecipe?.waterGrams || 240)
  const [ratio, setRatio] = useState(initialRecipe?.ratio || 16)
  const [temperature, setTemperature] = useState(initialRecipe?.temperature || 93)
  const [grindSize, setGrindSize] = useState<GrindSize>(initialRecipe?.grindSize || 'medium_fine')
  const [beanOrigin, setBeanOrigin] = useState(initialRecipe?.beanOrigin || '')
  const [stages, setStages] = useState<BrewStage[]>(
    initialRecipe?.stages || DEFAULT_STAGES.map(s => ({ ...s, id: uuidv4() }))
  )

  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialRecipe) {
      nameInputRef.current?.focus()
    }
  }, [initialRecipe])

  // Enforce roles whenever stages change
  useEffect(() => {
    if (stages.length < 2) return;
    
    let changed = false;
    const newStages = [...stages];
    
    if (newStages[0].name !== 'Blooming') {
      newStages[0] = { ...newStages[0], name: 'Blooming' };
      changed = true;
    }
    
    const lastIdx = newStages.length - 1;
    if (newStages[lastIdx].name !== 'Drawdown') {
      newStages[lastIdx] = { ...newStages[lastIdx], name: 'Drawdown' };
      changed = true;
    }
    
    if (changed) {
      setStages(newStages);
    }
  }, [stages])

  // Calculation Handlers
  const handleCoffeeChange = (val: number) => {
    setCoffeeGrams(val)
    const newWater = parseFloat((val * ratio).toFixed(1))
    setWaterGrams(newWater)
    // Adjust logic to distribute extra water to main pour (usually stage 1 or index 1)
    if (stages.length > 1) {
      const diff = newWater - waterGrams
      const newStages = [...stages]
      const targetIdx = Math.min(1, stages.length - 2)
      newStages[targetIdx] = { ...newStages[targetIdx], targetWeight: Math.max(0, newStages[targetIdx].targetWeight + diff) }
      setStages(newStages)
    }
  }

  const handleRatioChange = (val: number) => {
    setRatio(val)
    const newWater = parseFloat((coffeeGrams * val).toFixed(1))
    setWaterGrams(newWater)
    // Re-distribute water
    if (stages.length > 1) {
      const diff = newWater - waterGrams
      const newStages = [...stages]
      const targetIdx = Math.min(1, stages.length - 2)
      newStages[targetIdx] = { ...newStages[targetIdx], targetWeight: Math.max(0, newStages[targetIdx].targetWeight + diff) }
      setStages(newStages)
    }
  }

  const handleWaterChange = (val: number) => {
    const diff = val - waterGrams
    setWaterGrams(val)
    setRatio(parseFloat((val / coffeeGrams).toFixed(1)))
    // Distribute to main stage
    if (stages.length > 1) {
      const newStages = [...stages]
      const targetIdx = Math.min(1, stages.length - 2)
      newStages[targetIdx] = { ...newStages[targetIdx], targetWeight: Math.max(0, newStages[targetIdx].targetWeight + diff) }
      setStages(newStages)
    }
  }

  const handleStageWeightUpdate = (id: string, newWeight: number) => {
    const idx = stages.findIndex(s => s.id === id)
    if (idx === -1) return

    const oldWeight = stages[idx].targetWeight
    const diff = newWeight - oldWeight
    
    const newStages = [...stages]
    newStages[idx] = { ...newStages[idx], targetWeight: newWeight }

    // Waterfall: Adjust the next balance-able stage
    // If it's the last stage, adjust the previous
    if (idx === stages.length - 1) {
      if (idx > 0) {
        newStages[idx-1] = { ...newStages[idx-1], targetWeight: Math.max(0, newStages[idx-1].targetWeight - diff) }
      }
    } else {
      // Adjust the next one
      newStages[idx+1] = { ...newStages[idx+1], targetWeight: Math.max(0, newStages[idx+1].targetWeight - diff) }
    }
    
    setStages(newStages)
  }

  const updateStage = (id: string, updates: Partial<BrewStage>) => {
    if ('targetWeight' in updates) {
      handleStageWeightUpdate(id, updates.targetWeight!)
    } else {
      setStages(stages.map(s => s.id === id ? { ...s, ...updates } : s))
    }
  }

  const addStage = () => {
    const currentTotal = parseFloat(stages.reduce((acc, s) => acc + s.targetWeight, 0).toFixed(1))
    const remainder = waterGrams - currentTotal
    
    let suggestedWeight = 0
    let sourceId = ''

    if (remainder > 1) {
      suggestedWeight = remainder
    } else if (stages.length > 2) {
      // Find largest stage to split (excluding first and last)
      const midStages = stages.slice(1, -1)
      const largest = [...midStages].sort((a, b) => b.targetWeight - a.targetWeight)[0]
      if (largest && largest.targetWeight > 10) {
        suggestedWeight = parseFloat((largest.targetWeight / 2).toFixed(1))
        sourceId = largest.id
      }
    }

    const newStage = { id: uuidv4(), name: 'Main Pour', targetWeight: suggestedWeight, targetSeconds: 30, temperature: temperature }
    const newStages = [...stages]
    
    // Apply source split if needed
    if (sourceId) {
      const sourceIdx = newStages.findIndex(s => s.id === sourceId)
      newStages[sourceIdx] = { ...newStages[sourceIdx], targetWeight: parseFloat((newStages[sourceIdx].targetWeight - suggestedWeight).toFixed(1)) }
    }

    newStages.splice(stages.length - 1, 0, newStage)
    setStages(newStages)
  }

  const removeStage = (id: string) => {
    const idx = stages.findIndex(s => s.id === id)
    if (idx === -1 || idx === 0 || idx === stages.length - 1) return // Protect Blooming & Drawdown

    const removedWeight = stages[idx].targetWeight
    const newStages = stages.filter(s => s.id !== id)
    
    // Transfer weight to the stage that moved into this position or the one after
    const adjustIdx = Math.min(idx, newStages.length - 2)
    newStages[adjustIdx] = { ...newStages[adjustIdx], targetWeight: parseFloat((newStages[adjustIdx].targetWeight + removedWeight).toFixed(1)) }
    
    setStages(newStages)
  }

  const totalStageWeight = parseFloat(stages.reduce((acc, s) => acc + s.targetWeight, 0).toFixed(1))
  const totalStageTime = stages.reduce((acc, s) => acc + s.targetSeconds, 0)
  const weightMismatch = Math.abs(totalStageWeight - waterGrams) > 0.1
  const isHighComplexity = stages.length >= 6

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      method,
      coffeeGrams,
      waterGrams,
      ratio,
      temperature,
      grindSize,
      beanOrigin,
      stages,
      aiGenerated: initialRecipe?.aiGenerated || false
    })
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.sectionTitle}>
              {initialRecipe ? 'Kernel Edit Mode' : 'New Formulation'}
            </div>
            <h2 className={styles.title}>{initialRecipe ? 'Edit Recipe' : 'Create Recipe'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <form id="recipe-form" onSubmit={handleSubmit}>
            {weightMismatch && (
              <div className={styles.validationBar}>
                <Info size={14} />
                <span>Weight Mismatch: Stage total ({totalStageWeight}g) vs Target ({waterGrams}g)</span>
              </div>
            )}

            {isHighComplexity && coffeeGrams < 30 && (
                <div className={styles.complexityWarning}>
                    <Zap size={24} color="var(--cyber-teal)" />
                    <div>
                        <strong>High-Complexity Formulation Detected</strong>
                        Maintaining thermal and extraction stability across 6+ pours is difficult with small doses. 
                        Gemini suggests a coffee dose of <strong>30g - 45g</strong> for this many stages.
                    </div>
                </div>
            )}

            {/* Identity Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Identity</div>
              <div className={styles.grid}>
                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>Nomenclature / Name</label>
                  <input 
                    ref={nameInputRef}
                    className={styles.input}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Kinetic V60"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Extraction Method</label>
                  <select className={styles.select} value={method} onChange={e => setMethod(e.target.value as BrewMethod)}>
                    <option value="v60">V60</option>
                    <option value="aeropress">AeroPress</option>
                    <option value="french_press">French Press</option>
                    <option value="chemex">Chemex</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Origin Profile</label>
                  <input 
                    className={styles.input}
                    value={beanOrigin}
                    onChange={e => setBeanOrigin(e.target.value)}
                    placeholder="e.g. Ethiopia"
                  />
                </div>
              </div>
            </div>

            {/* Parameters Section */}
            <div className={styles.section} style={{ marginTop: 'var(--space-8)' }}>
              <div className={styles.sectionTitle}>Parameters</div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Coffee Dose (g)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className={styles.input}
                    value={coffeeGrams}
                    onChange={e => handleCoffeeChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Target Yield (g)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className={styles.input}
                    value={waterGrams}
                    onChange={e => handleWaterChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Ratio (1:X)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className={styles.input}
                    value={ratio}
                    onChange={e => handleRatioChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Temperature (°C)</label>
                  <input 
                    type="number"
                    className={styles.input}
                    value={temperature}
                    onChange={e => setTemperature(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Stages Section */}
            <div className={styles.section} style={{ marginTop: 'var(--space-8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className={styles.sectionTitle}>Staging Sequence</div>
                <button 
                    type="button" 
                    onClick={addStage} 
                    className="btn btn-sm btn-ghost" 
                    style={{ fontSize: '10px' }}
                >
                  + Add Stage
                </button>
              </div>
              
              <div className={styles.stageList}>
                {stages.map((stage, idx) => {
                  const isMandatory = idx === 0 || idx === stages.length - 1;
                  return (
                    <motion.div layout key={stage.id} className={styles.stageItem}>
                      <div className={styles.stageNum}>{idx + 1}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.fieldLabel}>Profile</div>
                        <input 
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '12px', opacity: isMandatory ? 0.6 : 1 }}
                            value={stage.name}
                            readOnly={isMandatory}
                            onChange={e => !isMandatory && updateStage(stage.id, { name: e.target.value })}
                        />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <div className={styles.fieldLabel}><Droplets size={8} /> Weight</div>
                        <input 
                          type="number"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '12px', width: '100%' }}
                          value={stage.targetWeight}
                          onChange={e => updateStage(stage.id, { targetWeight: parseFloat(e.target.value) || 0 })}
                        />
                        <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: '9px', opacity: 0.4 }}>g</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <div className={styles.fieldLabel}><Timer size={8} /> Time</div>
                        <input 
                          type="number"
                          className={styles.input}
                          style={{ padding: '6px 10px', fontSize: '12px', width: '100%' }}
                          value={stage.targetSeconds}
                          onChange={e => updateStage(stage.id, { targetSeconds: parseInt(e.target.value) || 0 })}
                        />
                        <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: '9px', opacity: 0.4 }}>s</span>
                      </div>
                      <button 
                        type="button" 
                        className={styles.removeStage} 
                        onClick={() => !isMandatory && removeStage(stage.id)}
                        style={{ opacity: isMandatory ? 0 : 1, cursor: isMandatory ? 'default' : 'pointer', marginBottom: 8 }}
                        disabled={isMandatory}
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <Timer size={14} color="var(--cyber-teal)" />
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>{Math.floor(totalStageTime / 60)}:{(totalStageTime % 60).toString().padStart(2, '0')}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <Droplets size={14} color="var(--cyber-amber)" />
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>{totalStageWeight}g / {waterGrams}g</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button form="recipe-form" type="submit" className="btn btn-primary" style={{ background: 'var(--cyber-amber)', color: '#000', fontWeight: 800 }}>
            <Save size={16} /> SAVE FORMULA
          </button>
        </div>
      </div>
    </div>
  )
}
