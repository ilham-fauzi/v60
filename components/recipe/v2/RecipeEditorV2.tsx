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
  { name: 'Blooming', targetWeight: 50, targetSeconds: 50, temperature: 93, notes: 'Degas and saturate grounds' },
  { name: 'Main Pour', targetWeight: 240, targetSeconds: 60, temperature: 93 },
  { name: 'Drawdown', targetWeight: 0, targetSeconds: 60, temperature: 0 },
]

export function RecipeEditorV2({ initialRecipe, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialRecipe?.name || '')
  const [method, setMethod] = useState<BrewMethod>(initialRecipe?.method || 'v60')
  const [coffeeGrams, setCoffeeGrams] = useState(initialRecipe?.coffeeGrams || 15)
  const [waterGrams, setWaterGrams] = useState(initialRecipe?.waterGrams || 240)
  const [iceGrams, setIceGrams] = useState(initialRecipe?.iceGrams || 0)
  const [ratio, setRatio] = useState(initialRecipe?.ratio || 16)
  const [temperature, setTemperature] = useState(initialRecipe?.temperature || 93)
  const [grindSize, setGrindSize] = useState<GrindSize>(initialRecipe?.grindSize || 'medium_fine')
  const [beanOrigin, setBeanOrigin] = useState(initialRecipe?.beanOrigin || '')
  const [stages, setStages] = useState<BrewStage[]>(
    initialRecipe?.stages || DEFAULT_STAGES.map(s => ({ ...s, id: uuidv4() }))
  )
  const [modifiedStages, setModifiedStages] = useState<Set<string>>(new Set(initialRecipe ? stages.map(s => s.id) : []))
  const [viewMode, setViewMode] = useState<'total' | 'step'>('total')
  const [errorWarning, setErrorWarning] = useState<string | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialRecipe) {
      nameInputRef.current?.focus()
    }
  }, [initialRecipe])

  // Precise rounding helper to 1 decimal place
  const roundToOne = (num: number) => Math.round(num * 10) / 10

  // Time formatting helpers
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const parseTime = (timeStr: string) => {
    if (!timeStr.includes(':')) return parseInt(timeStr) || 0
    const [min, sec] = timeStr.split(':').map(val => parseInt(val) || 0)
    return (min * 60) + sec
  }

  // Calculation Handlers
  const calculateSmartSequence = (water: number, coffee: number, stageCount: number): Omit<BrewStage, 'id'>[] => {
    if (stageCount < 2) return []

    const waterVal = roundToOne(water)
    const coffeeVal = roundToOne(coffee)
    const bloomWeight = Math.min(roundToOne(coffeeVal * 3), roundToOne(waterVal * 0.25))
    const result: Omit<BrewStage, 'id'>[] = []

    // 1. Bloom
    result.push({ 
      name: 'Blooming', 
      targetWeight: bloomWeight, 
      targetSeconds: 45, 
      temperature: temperature 
    })

    // 2. Main Pours
    const remainingStages = stageCount - 2
    if (remainingStages > 0) {
      const weightStep = (waterVal - bloomWeight) / remainingStages
      for (let i = 1; i <= remainingStages; i++) {
        const cumulativeWeight = roundToOne(bloomWeight + (weightStep * i))
        result.push({
          name: i === 1 ? 'Main Pour' : `Pour ${i}`,
          targetWeight: cumulativeWeight,
          targetSeconds: 45,
          temperature: temperature
        })
      }
    }

    // 3. Drawdown
    result.push({
      name: 'Drawdown',
      targetWeight: 0,
      targetSeconds: 60,
      temperature: 0
    })

    return result
  }

  const applySmartSuggest = (water: number, coffee: number, currentStages: BrewStage[]) => {
    const smart = calculateSmartSequence(water, coffee, currentStages.length)
    return currentStages.map((s, idx) => {
      // If the stage is modified, keep it. Otherwise, use smart suggestion.
      if (modifiedStages.has(s.id)) return s
      return { ...s, ...smart[idx] }
    })
  }

  const standardizeSequence = () => {
    const smart = calculateSmartSequence(waterGrams, coffeeGrams, stages.length)
    const newStages = stages.map((s, idx) => ({ ...s, ...smart[idx] }))
    setStages(newStages)
    setModifiedStages(new Set()) // Reset modifications
    setErrorWarning(null)
  }

  // Enforce roles and auto-suggest
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
  const rebalanceStagesProportionally = (newTotal: number, currentStages: BrewStage[]) => {
    // Find the last non-drawdown total
    const nonDrawdownStages = currentStages.filter(s => s.name !== 'Drawdown')
    const currentTotal = nonDrawdownStages.length > 0 ? nonDrawdownStages[nonDrawdownStages.length - 1].targetWeight : 0
    if (currentTotal === 0 || isNaN(currentTotal)) return currentStages

    const factor = newTotal / currentTotal
    return currentStages.map((s, idx) => {
        const isDrawdown = s.name === 'Drawdown' || idx === currentStages.length - 1
        return { 
          ...s, 
          targetWeight: isDrawdown ? 0 : parseFloat((s.targetWeight * factor).toFixed(1)) 
        }
    })
  }

  const handleCoffeeChange = (val: number) => {
    if (isNaN(val) || val <= 0) {
      setCoffeeGrams(val)
      return
    }
    const roundedVal = roundToOne(val)
    setCoffeeGrams(roundedVal)
    const newWater = Math.max(0, roundToOne(roundedVal * ratio) - iceGrams)
    setWaterGrams(newWater)
    setStages(prev => applySmartSuggest(newWater, roundedVal, prev))
  }

  const handleRatioChange = (val: number) => {
    if (isNaN(val) || val <= 0) {
      setRatio(val)
      return
    }
    const roundedVal = roundToOne(val)
    setRatio(roundedVal)
    const newWater = Math.max(0, roundToOne(coffeeGrams * roundedVal) - iceGrams)
    setWaterGrams(newWater)
    setStages(prev => applySmartSuggest(newWater, coffeeGrams, prev))
  }

  const handleWaterChange = (val: number) => {
    if (isNaN(val) || val <= 0) {
      setWaterGrams(val)
      return
    }
    const roundedVal = roundToOne(val)
    setWaterGrams(roundedVal)
    setRatio(roundToOne((roundedVal + iceGrams) / coffeeGrams))
    setStages(prev => applySmartSuggest(roundedVal, coffeeGrams, prev))
  }

  const handleIceChange = (val: number) => {
    if (isNaN(val) || val < 0) {
      setIceGrams(0)
      return
    }
    const roundedVal = roundToOne(val)
    setIceGrams(roundedVal)
    setRatio(roundToOne((waterGrams + roundedVal) / coffeeGrams))
  }

  const handleStageWeightUpdate = (id: string, newTotal: number) => {
    const idx = stages.findIndex(s => s.id === id)
    if (idx === -1) return
    
    const isDrawdown = stages[idx].name === 'Drawdown' || idx === stages.length - 1
    
    // Drawdown represents waiting time, no water is added
    if (isDrawdown) {
       return
    }
    
    const prevWeight = idx > 0 ? stages[idx - 1].targetWeight : 0
    if (newTotal < prevWeight) return

    // Track modification
    const newModified = new Set(modifiedStages)
    newModified.add(id)
    setModifiedStages(newModified)

    const newStages = [...stages]
    
    if (newTotal > waterGrams) {
        setErrorWarning(`Warning: Stage ${idx + 1} (${newTotal.toFixed(1)}g) exceeds final target yield (${waterGrams.toFixed(1)}g).`)
        newStages[idx] = { ...newStages[idx], targetWeight: newTotal }
        setStages(newStages)
        return
    }
    
    setErrorWarning(null)
    const oldWeight = stages[idx].targetWeight
    const diff = newTotal - oldWeight
    
    newStages[idx] = { ...newStages[idx], targetWeight: newTotal }
    
    // Proportional redistribution for subsequent stages (excluding last one)
    for (let i = idx + 1; i < newStages.length - 1; i++) {
        newStages[i] = { 
            ...newStages[i], 
            targetWeight: roundToOne(Math.max(newTotal, Math.min(waterGrams, newStages[i].targetWeight + diff)))
        }
    }
    
    setStages(newStages)
  }

  const handleStageTimeUpdate = (id: string, newVal: string | number) => {
    const idx = stages.findIndex(s => s.id === id)
    if (idx === -1) return

    const newSeconds = typeof newVal === 'string' ? parseTime(newVal) : newVal
    const prevCumulative = stages.slice(0, idx).reduce((acc, s) => acc + s.targetSeconds, 0)

    if (viewMode === 'total') {
      const calculatedDuration = Math.max(0, newSeconds - prevCumulative)
      updateStage(id, { targetSeconds: calculatedDuration })
    } else {
      updateStage(id, { targetSeconds: Math.max(0, newSeconds) })
    }
  }

  const updateStage = (id: string, updates: Partial<BrewStage>) => {
    const newModified = new Set(modifiedStages)
    newModified.add(id)
    setModifiedStages(newModified)
    
    if ('targetWeight' in updates) {
      handleStageWeightUpdate(id, updates.targetWeight!)
    } else {
      setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    }
  }

  const addStage = () => {
    setStages(prev => {
      const updated = [...prev]
      const drawdown = updated.pop()!
      updated.push({
        id: uuidv4(),
        name: `Pour ${updated.length}`,
        targetWeight: waterGrams,
        targetSeconds: 45,
        temperature: temperature
      })
      updated.push(drawdown)
      return applySmartSuggest(waterGrams, coffeeGrams, updated)
    })
  }

  const removeStage = (id: string) => {
    const idx = stages.findIndex(s => s.id === id)
    if (idx === -1 || idx === 0 || idx === stages.length - 1) return

    const newModified = new Set(modifiedStages)
    newModified.delete(id)
    setModifiedStages(newModified)

    setStages(prev => {
      const filtered = prev.filter(s => s.id !== id)
      return applySmartSuggest(waterGrams, coffeeGrams, filtered)
    })
  }

  const lastPourStage = [...stages].reverse().find(s => s.name !== 'Drawdown')
  const totalStageWeight = lastPourStage?.targetWeight || 0
  const totalStageTime = stages.reduce((acc, s) => acc + s.targetSeconds, 0)
  const weightMismatch = Math.abs(totalStageWeight - waterGrams) > 0.1
  const isHighComplexity = stages.length >= 6
  const isInfused = name.toLowerCase().includes('infused')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      method,
      coffeeGrams,
      waterGrams,
      iceGrams,
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
            {errorWarning && (
              <div className={styles.validationBar} style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>
                <Info size={14} />
                <span>{errorWarning}</span>
              </div>
            )}

            {weightMismatch && !errorWarning && (
              <div className={styles.validationBar}>
                <Info size={14} />
                <span>Weight Mismatch: Sequence Total ({totalStageWeight.toFixed(1)}g) vs Target Yield ({waterGrams.toFixed(1)}g)</span>
              </div>
            )}

            {isInfused && (
                <div className={styles.complexityWarning} style={{ borderColor: 'var(--cyber-amber)' }}>
                    <Info size={24} color="var(--cyber-amber)" />
                    <div>
                        <strong>Barista Optimization Tip</strong>
                        For Infused/Anaerobic processed beans, a longer blooming phase (**45s - 60s**) is recommended to enhance sweetness and allow the complex flavors to stabilize.
                    </div>
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
                    value={coffeeGrams || ''}
                    onChange={e => handleCoffeeChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Target Yield (g)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className={styles.input}
                    value={waterGrams || ''}
                    onChange={e => handleWaterChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Ice Amount (g)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className={styles.input}
                    value={iceGrams || ''}
                    onChange={e => handleIceChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Ratio (1:X)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className={styles.input}
                    value={ratio || ''}
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

            <div className={styles.section} style={{ marginTop: 'var(--space-8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <div className={styles.sectionTitle}>Staging Sequence</div>
                    <button 
                      type="button" 
                      onClick={standardizeSequence}
                      className={styles.magicBtn}
                      title="Apply Smart Balanced Sequence"
                    >
                      <Zap size={10} /> <span>Smart Suggest</span>
                    </button>
                </div>

                <div className={styles.segmentedControl}>
                  <button 
                    type="button" 
                    className={viewMode === 'total' ? styles.activeSegment : ''} 
                    onClick={() => setViewMode('total')}
                  >
                    Total Mode
                  </button>
                  <button 
                    type="button" 
                    className={viewMode === 'step' ? styles.activeSegment : ''} 
                    onClick={() => setViewMode('step')}
                  >
                    Step Mode
                  </button>
                </div>

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
                  const prevTotalWeight = idx > 0 ? stages[idx - 1].targetWeight : 0
                  const displayWeight = viewMode === 'step' 
                    ? roundToOne(stage.targetWeight - prevTotalWeight) 
                    : stage.targetWeight

                  const cumulativeSeconds = stages.slice(0, idx + 1).reduce((acc, s) => acc + s.targetSeconds, 0)
                  const displayTime = viewMode === 'total' 
                    ? formatTime(cumulativeSeconds) 
                    : stage.targetSeconds

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
                        <div className={styles.fieldLabel}>
                          <Droplets size={8} /> Weight
                          {!modifiedStages.has(stage.id) && stage.name !== 'Drawdown' && <span className={styles.autoTag}>Auto</span>}
                        </div>
                        <div style={{ position: 'relative' }}>
                          {viewMode === 'step' && stage.name !== 'Drawdown' && (
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--cyber-teal)', pointerEvents: 'none' }}>+</span>
                          )}
                          <input 
                            type="number"
                            step="0.1"
                            className={styles.input}
                            style={{ 
                              padding: '6px 10px', 
                              paddingLeft: (viewMode === 'step' && stage.name !== 'Drawdown') ? '20px' : '10px',
                              fontSize: '12px', 
                              width: '100%', 
                              opacity: stage.name === 'Drawdown' ? 0.4 : 1 
                            }}
                            value={stage.name === 'Drawdown' ? "0" : (displayWeight || '')}
                            readOnly={stage.name === 'Drawdown'}
                            onChange={e => {
                                const val = parseFloat(e.target.value) || 0
                                if (viewMode === 'step') {
                                    handleStageWeightUpdate(stage.id, roundToOne(prevTotalWeight + val))
                                } else {
                                    handleStageWeightUpdate(stage.id, val)
                                }
                            }}
                          />
                          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: '9px', opacity: 0.4 }}>g</span>
                        </div>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <div className={styles.fieldLabel}>
                          <Timer size={8} /> Time
                          {!modifiedStages.has(stage.id) && <span className={styles.autoTag}>Auto</span>}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text"
                            className={styles.input}
                            style={{ padding: '6px 10px', fontSize: '12px', width: '100%' }}
                            value={displayTime || ''}
                            onChange={e => handleStageTimeUpdate(stage.id, e.target.value)}
                          />
                          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: '9px', opacity: 0.4 }}>
                              {viewMode === 'total' ? 'at' : 'sec'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-2)', marginTop: 8 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className={styles.fieldLabel}>Action</div>
                            <select 
                                className={styles.select}
                                style={{ padding: '6px 10px', fontSize: '12px', opacity: (isMandatory && idx === stages.length - 1) ? 0.6 : 1 }}
                                value={stage.action || 'none'}
                                disabled={isMandatory && idx === stages.length - 1}
                                onChange={e => updateStage(stage.id, { action: e.target.value as any })}
                            >
                                <option value="none">None</option>
                                <option value="stir">Stir (Aduk)</option>
                                <option value="swirl">Swirl (Putar)</option>
                                <option value="steep">Steep (Hold)</option>
                                <option value="open-valve">Open Valve</option>
                                <option value="close-valve">Close Valve</option>
                                <option value="press">Press / Plunge</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className={styles.fieldLabel}>Notes</div>
                            <input 
                                className={styles.input}
                                placeholder="E.g. stir 3x..."
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                value={stage.notes || ''}
                                onChange={e => updateStage(stage.id, { notes: e.target.value })}
                            />
                          </div>
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
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>{totalStageWeight.toFixed(1)}g / {waterGrams.toFixed(1)}g</span>
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
