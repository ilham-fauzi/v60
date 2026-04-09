'use client'

import styles from './AIInsightPanel.module.css'
import { useState, useCallback } from 'react'
import { useBrewStore } from '@/stores/BrewStore'
import { useAIStore } from '@/stores/AIStore'
import { useRecipeStore } from '@/stores/RecipeStore'
import type { SensoryFeedback, AIOptimization } from '@/types'

// --- Recipe Suggest Panel ---
export function AIRecipePanel() {
  const { addRecipe, recipes } = useRecipeStore()
  const { setThinking, setLastSuggestion, setOptimizations, setError } = useAIStore()
  const { isThinking, lastSuggestion, optimizations } = useAIStore()

  const [beanProfile, setBeanProfile] = useState('')
  const [method, setMethod] = useState('V60')

  const handleSuggest = useCallback(async () => {
    if (!beanProfile.trim()) return
    setThinking(true)
    setLastSuggestion(null)
    setError(null)

    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beanProfile, method, coffeeGrams: 15 }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'AI suggestion failed')
      }

      const data = await res.json()
      setLastSuggestion(JSON.stringify(data))

      // Show tips, reasoning in panel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setThinking(false)
    }
  }, [beanProfile, method, setThinking, setLastSuggestion, setError])

  const parsedSuggestion = (() => {
    if (!lastSuggestion) return null
    try { return JSON.parse(lastSuggestion) } catch { return null }
  })()

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.aiIcon}>✨</span>
          <h3 className={styles.panelTitle}>AI Recipe Engine</h3>
        </div>
        <div className="badge badge-accent">Gemini 1.5</div>
      </div>

      <div className={styles.inputGroup}>
        <label className="label" htmlFor="bean-profile-input">Bean Profile</label>
        <input
          id="bean-profile-input"
          className="input"
          placeholder="e.g. Ethiopia Yirgacheffe, Light Roast, Floral notes"
          value={beanProfile}
          onChange={(e) => setBeanProfile(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className="label" htmlFor="method-select">Brew Method</label>
        <select id="method-select" className="input select" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="V60">V60 Pour Over</option>
          <option value="AeroPress">AeroPress</option>
          <option value="French Press">French Press</option>
          <option value="Chemex">Chemex</option>
          <option value="Kalita Wave">Kalita Wave</option>
        </select>
      </div>

      <button
        id="ai-suggest-btn"
        className={`btn btn-primary ${styles.suggestBtn}`}
        onClick={handleSuggest}
        disabled={isThinking || !beanProfile.trim()}
      >
        {isThinking ? (
          <><span className="animate-spin">⟳</span> Analyzing Bean Profile...</>
        ) : (
          <><span>✨</span> Generate AI Recipe</>
        )}
      </button>

      {/* Results */}
      {parsedSuggestion && (
        <div className={styles.results}>
          <div className={styles.resultGrid}>
            <div className={styles.resultStat}>
              <span className={styles.resultLabel}>Temperature</span>
              <span className={`${styles.resultValue} num`}>{parsedSuggestion.temperature}°C</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultLabel}>Ratio</span>
              <span className={`${styles.resultValue} num`}>1:{parsedSuggestion.ratio}</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultLabel}>Grind</span>
              <span className={styles.resultValue}>{parsedSuggestion.grindSize?.replace(/_/g, ' ')}</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultLabel}>Water</span>
              <span className={`${styles.resultValue} num`}>{parsedSuggestion.waterGrams}g</span>
            </div>
          </div>

          {parsedSuggestion.reasoning && (
            <div className={styles.reasoning}>
              <p>{parsedSuggestion.reasoning}</p>
            </div>
          )}

          {parsedSuggestion.tips && parsedSuggestion.tips.length > 0 && (
            <div className={styles.tips}>
              <div className={styles.tipsLabel}>Barista Tips</div>
              <ul className={styles.tipList}>
                {parsedSuggestion.tips.map((tip: string, i: number) => (
                  <li key={i} className={styles.tipItem}>
                    <span className={styles.tipDot}>→</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Post-Brew Optimization Panel ---
export function AIOptimizePanel() {
  const { activeRecipe } = useBrewStore()
  const { setThinking, setOptimizations, setError, isThinking, optimizations } = useAIStore()
  const [feedback, setFeedback] = useState<Partial<SensoryFeedback>>({
    sweetness: 3,
    acidity: 3,
    bitterness: 3,
    body: 3,
    overallScore: 3,
    notes: '',
  })
  const [diagnosis, setDiagnosis] = useState<string | null>(null)
  const [nextBrewNote, setNextBrewNote] = useState<string | null>(null)

  const handleOptimize = useCallback(async () => {
    setThinking(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, recipe: activeRecipe }),
      })

      if (!res.ok) throw new Error('Optimization failed')
      const data = await res.json()
      setDiagnosis(data.diagnosis)
      setOptimizations(data.optimizations || [])
      setNextBrewNote(data.nextBrewNote)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setThinking(false)
    }
  }, [feedback, activeRecipe, setThinking, setOptimizations, setError])

  const sliders: { key: keyof SensoryFeedback; label: string; icon: string }[] = [
    { key: 'sweetness', label: 'Sweetness', icon: '🍯' },
    { key: 'acidity', label: 'Acidity', icon: '🍋' },
    { key: 'bitterness', label: 'Bitterness', icon: '🫖' },
    { key: 'body', label: 'Body', icon: '💧' },
    { key: 'overallScore', label: 'Overall', icon: '⭐' },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.aiIcon}>🔬</span>
          <h3 className={styles.panelTitle}>Smart Dial-In</h3>
        </div>
        <div className="badge badge-info">Post-Brew</div>
      </div>

      <p className={styles.description}>
        Rate your brew and let AI optimize your next recipe.
      </p>

      {sliders.map(({ key, label, icon }) => (
        <div key={key} className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <span>{icon} {label}</span>
            <span className={`${styles.sliderVal} num`}>{feedback[key] ?? 3}/5</span>
          </div>
          <input
            type="range"
            min={1} max={5} step={1}
            value={feedback[key] ?? 3}
            onChange={(e) => setFeedback((f) => ({ ...f, [key]: Number(e.target.value) }))}
            className={styles.slider}
          />
          <div className={styles.sliderLabels}>
            <span>Low</span><span>High</span>
          </div>
        </div>
      ))}

      <div className={styles.inputGroup}>
        <label className="label" htmlFor="brew-notes">Tasting Notes</label>
        <textarea
          id="brew-notes"
          className={`input ${styles.textarea}`}
          placeholder="e.g. Slightly bitter finish, thin body, lacks sweetness..."
          value={feedback.notes ?? ''}
          onChange={(e) => setFeedback((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
        />
      </div>

      <button
        id="ai-optimize-btn"
        className={`btn btn-primary ${styles.suggestBtn}`}
        onClick={handleOptimize}
        disabled={isThinking}
      >
        {isThinking ? (
          <><span className="animate-spin">⟳</span> Analyzing Brew...</>
        ) : (
          <><span>🔬</span> Analyze & Optimize</>
        )}
      </button>

      {/* Diagnosis & Suggestions */}
      {(diagnosis || optimizations.length > 0) && (
        <div className={styles.results}>
          {diagnosis && (
            <div className={styles.diagnosis}>
              <span className={styles.diagnosisIcon}>💡</span>
              <p>{diagnosis}</p>
            </div>
          )}
          {optimizations.map((opt, i) => (
            <div key={i} className={styles.optimization}>
              <div className={styles.optHeader}>
                <span className={styles.optParam}>{opt.parameter}</span>
                <div className={styles.optValues}>
                  <span className={styles.optOld}>{opt.previousValue}</span>
                  <span className={styles.optArrow}>→</span>
                  <span className={styles.optNew}>{opt.suggestedValue}</span>
                </div>
              </div>
              <p className={styles.optReason}>{opt.reason}</p>
            </div>
          ))}
          {nextBrewNote && (
            <div className={styles.nextBrewNote}>
              <span>📝</span> <p>{nextBrewNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main Panel Wrapper ---
export function AIInsightPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <AIRecipePanel />
      <AIOptimizePanel />
    </div>
  )
}
