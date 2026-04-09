'use client'

import React, { useState, useEffect, useCallback } from 'react'
import styles from './RecipeEditor.module.css'
import type { Recipe, BrewMethod, GrindSize, BrewStage } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  initialRecipe: Recipe | null
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const DEFAULT_STAGES: Omit<BrewStage, 'id'>[] = [
  { name: 'Bloom', targetWeight: 30, targetSeconds: 45, temperature: 93, notes: 'Saturate all grounds' },
  { name: 'Main Pour', targetWeight: 195, targetSeconds: 60, temperature: 93 },
  { name: 'Drawdown', targetWeight: 0, targetSeconds: 60, temperature: 0 },
]

export function RecipeEditor({ initialRecipe, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialRecipe?.name || '')
  const nameInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialRecipe && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [initialRecipe])
  const [method, setMethod] = useState<BrewMethod>(initialRecipe?.method || 'v60')
  const [coffeeGrams, setCoffeeGrams] = useState(initialRecipe?.coffeeGrams || 15)
  const [waterGrams, setWaterGrams] = useState(initialRecipe?.waterGrams || 225)
  const [ratio, setRatio] = useState(initialRecipe?.ratio || 15)
  const [temperature, setTemperature] = useState(initialRecipe?.temperature || 93)
  const [grindSize, setGrindSize] = useState<GrindSize>(initialRecipe?.grindSize || 'medium_fine')
  const [beanOrigin, setBeanOrigin] = useState(initialRecipe?.beanOrigin || '')
  const [stages, setStages] = useState<BrewStage[]>(
    initialRecipe?.stages || DEFAULT_STAGES.map(s => ({ ...s, id: uuidv4() }))
  )

  // Smart Calculation Handlers
  const handleCoffeeChange = (val: number) => {
    setCoffeeGrams(val)
    setWaterGrams(parseFloat((val * ratio).toFixed(1)))
  }

  const handleWaterChange = (val: number) => {
    setWaterGrams(val)
    setRatio(parseFloat((val / coffeeGrams).toFixed(1)))
  }

  const handleRatioChange = (val: number) => {
    setRatio(val)
    setWaterGrams(parseFloat((coffeeGrams * val).toFixed(1)))
  }

  const addStage = () => {
    setStages([...stages, { id: uuidv4(), name: 'New Stage', targetWeight: 0, targetSeconds: 30, temperature: 0 }])
  }

  const removeStage = (id: string) => {
    setStages(stages.filter(s => s.id !== id))
  }

  const updateStage = (id: string, updates: Partial<BrewStage>) => {
    setStages(stages.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const applyClassicStaging = () => {
    const bloomWeight = Math.min(coffeeGrams * 3, waterGrams * 0.2)
    const remainingWater = waterGrams - bloomWeight
    const mainPour = remainingWater
    
    const newStages: Omit<BrewStage, 'id'>[] = [
      { name: 'Bloom', targetWeight: bloomWeight, targetSeconds: 40, temperature, notes: 'Gentle swirl if possible' },
      { name: 'Main Pour', targetWeight: mainPour, targetSeconds: 80, temperature },
      { name: 'Drawdown', targetWeight: 0, targetSeconds: 60, temperature: 0, notes: 'Wait for bed to be dry' }
    ]
    setStages(newStages.map(s => ({ ...s, id: uuidv4() })))
  }

  const applyFiveStageStaging = () => {
    const perPour = parseFloat((waterGrams / 5).toFixed(1))
    
    const newStages: Omit<BrewStage, 'id'>[] = [
      { name: 'Bloom (Sweetness)', targetWeight: perPour, targetSeconds: 45, temperature },
      { name: 'Pour 2 (Acidity)', targetWeight: perPour, targetSeconds: 45, temperature },
      { name: 'Pour 3 (Strength)', targetWeight: perPour, targetSeconds: 45, temperature },
      { name: 'Pour 4 (Strength)', targetWeight: perPour, targetSeconds: 45, temperature },
      { name: 'Pour 5 (Final)', targetWeight: perPour, targetSeconds: 45, temperature }
    ]
    setStages(newStages.map(s => ({ ...s, id: uuidv4() })))
  }

  const totalStageWeight = stages.reduce((acc, s) => acc + s.targetWeight, 0)
  const totalStageTime = stages.reduce((acc, s) => acc + s.targetSeconds, 0)

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
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialRecipe ? 'Edit Recipe' : 'Create New Recipe'}</h2>
          <button className={styles.closeBtn} onClick={onCancel}>&times;</button>
        </div>

        <form className={styles.content} onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>📋 Basic Information</div>
            <div className={styles.grid}>
              <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                <label>Recipe Name</label>
                <input 
                  ref={nameInputRef}
                  type="text" 
                  className={styles.input} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Morning V60"
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Brew Method</label>
                <select 
                  className={styles.select} 
                  value={method} 
                  onChange={e => setMethod(e.target.value as BrewMethod)}
                >
                  <option value="v60">V60</option>
                  <option value="aeropress">AeroPress</option>
                  <option value="french_press">French Press</option>
                  <option value="chemex">Chemex</option>
                  <option value="kalita">Kalita</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Bean Origin / Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={beanOrigin} 
                  onChange={e => setBeanOrigin(e.target.value)} 
                  placeholder="e.g. Ethiopia Yirgacheffe"
                />
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>⚖️ Parameters</div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>Coffee <span className={styles.linkedBadge}>Linked</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    step="0.1"
                    className={styles.input} 
                    value={coffeeGrams} 
                    onChange={e => handleCoffeeChange(parseFloat(e.target.value) || 0)}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>g</span>
                </div>
              </div>
              <div className={styles.field}>
                <label>Ratio (1:X)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className={styles.input} 
                  value={ratio} 
                  onChange={e => handleRatioChange(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className={styles.field}>
                <label>Total Water <span className={styles.linkedBadge}>Linked</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    step="0.1"
                    className={styles.input} 
                    value={waterGrams} 
                    onChange={e => handleWaterChange(parseFloat(e.target.value) || 0)}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>g</span>
                </div>
              </div>
              <div className={styles.field}>
                <label>Temperature</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={temperature} 
                    onChange={e => setTemperature(parseInt(e.target.value) || 0)}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>°C</span>
                </div>
              </div>
              <div className={styles.field}>
                <label>Grind Size</label>
                <select 
                  className={styles.select} 
                  value={grindSize} 
                  onChange={e => setGrindSize(e.target.value as GrindSize)}
                >
                  <option value="fine">Fine</option>
                  <option value="medium_fine">Medium Fine</option>
                  <option value="medium">Medium</option>
                  <option value="medium_coarse">Medium Coarse</option>
                  <option value="coarse">Coarse</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stages */}
          <div className={styles.section}>
            <div className={styles.stagesHeader}>
              <div className={styles.sectionTitle}>⏱️ Brewing Stages</div>
              <div className={styles.suggestionGroup}>
                <span className={styles.suggestionLabel}>Suggest:</span>
                <button type="button" className={styles.suggestionBtn} onClick={applyClassicStaging}>3-Stage</button>
                <button type="button" className={styles.suggestionBtn} onClick={applyFiveStageStaging}>5-Stage</button>
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={addStage}>+ Add Stage</button>
            </div>
            
            <div className={styles.stageList}>
              {stages.map((stage, idx) => (
                <div key={stage.id} className={styles.stageItem}>
                  <div className={styles.stageNum}>{idx + 1}</div>
                  <div className={styles.field}>
                    <input 
                      type="text" 
                      placeholder="Stage Name"
                      className={styles.input} 
                      value={stage.name} 
                      onChange={e => updateStage(stage.id, { name: e.target.value })}
                    />
                  </div>
                  <div className={styles.field}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        placeholder="Weight"
                        className={styles.input} 
                        value={stage.targetWeight} 
                        onChange={e => updateStage(stage.id, { targetWeight: parseFloat(e.target.value) || 0 })}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem' }}>g</span>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        placeholder="Sec"
                        className={styles.input} 
                        value={stage.targetSeconds} 
                        onChange={e => updateStage(stage.id, { targetSeconds: parseInt(e.target.value) || 0 })}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem' }}>s</span>
                    </div>
                  </div>
                  <button type="button" className={styles.removeStage} onClick={() => removeStage(stage.id)} title="Remove Stage">
                    &times;
                  </button>
                  <div className={styles.field} style={{ gridColumn: '2 / span 3' }}>
                    <input 
                      type="text" 
                      placeholder="Notes (optional)"
                      className={`${styles.input} btn-sm`} 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      value={stage.notes || ''} 
                      onChange={e => updateStage(stage.id, { notes: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.stageSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{totalStageWeight}g</span>
                <span className={styles.summaryKey}>Current Total Water</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal} style={{ color: totalStageWeight !== waterGrams ? 'var(--warning)' : 'var(--success)' }}>
                  {waterGrams}g
                </span>
                <span className={styles.summaryKey}>Target Total Water</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryVal}>{Math.floor(totalStageTime / 60)}:{(totalStageTime % 60).toString().padStart(2, '0')}</span>
                <span className={styles.summaryKey}>Total Brew Time</span>
              </div>
            </div>
            {totalStageWeight !== waterGrams && (
              <p style={{ fontSize: '0.75rem', color: 'var(--warning)', textAlign: 'center', marginTop: '0.5rem' }}>
                ⚠️ Warning: Stage weights do not match target total water ({waterGrams}g).
              </p>
            )}
          </div>

          <div className={styles.footer}>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Recipe</button>
          </div>
        </form>
      </div>
    </div>
  )
}
