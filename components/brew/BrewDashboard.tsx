'use client'

import styles from './BrewDashboard.module.css'
import type { Recipe, BrewStage } from '@/types'
import { useBrewStore } from '@/stores/BrewStore'
import { useEffect, useRef, useCallback } from 'react'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatWeight(grams: number): string {
  return grams.toFixed(1)
}

interface Props {
  recipe: Recipe | null
}

export function BrewDashboard({ recipe }: Props) {
  const {
    currentWeight,
    targetWeight,
    currentFlowRate,
    isBrewing,
    isPaused,
    elapsedTime,
    totalElapsedTime,
    currentStageIndex,
    toggleBrew,
    pauseBrew,
    resumeBrew,
    stopBrew,
    nextStage,
    tare,
    tick,
  } = useBrewStore()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // High-resolution timer to avoid GC pauses affecting accuracy
  const tickRef = useRef(tick)
  tickRef.current = tick

  useEffect(() => {
    if (isBrewing && !isPaused) {
      timerRef.current = setInterval(() => tickRef.current(), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isBrewing, isPaused])

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); toggleBrew() }
      if (e.code === 'KeyT') { e.preventDefault(); tare() }
      if (e.code === 'Enter') { e.preventDefault(); if (isBrewing) nextStage() }
      if (e.code === 'KeyP') { e.preventDefault(); isPaused ? resumeBrew() : pauseBrew() }
    },
    [isBrewing, isPaused, toggleBrew, tare, nextStage, pauseBrew, resumeBrew]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const stages = recipe?.stages ?? []
  
  // Calculate cumulative target weights
  let cumulativeTarget = 0
  const stagesWithCumulative = stages.map(stage => {
    cumulativeTarget += stage.targetWeight
    return { ...stage, cumulativeTotal: cumulativeTarget }
  })

  const currentStage = stagesWithCumulative[currentStageIndex]
  const stageProgress = currentStage
    ? Math.min((elapsedTime / currentStage.targetSeconds) * 100, 100)
    : 0
  const totalProgress = targetWeight > 0 ? Math.min((currentWeight / targetWeight) * 100, 100) : 0
  const currentCumulativeTarget = currentStage?.cumulativeTotal ?? 0

  // Smart Stage Logic
  const timeRemaining = currentStage ? Math.max(0, currentStage.targetSeconds - elapsedTime) : 0
  const isPouring = isBrewing && currentFlowRate > 0.1
  const weightReached = currentWeight >= currentCumulativeTarget - 0.5
  const isResting = isBrewing && !isPouring && weightReached && timeRemaining > 0
  const isStageComplete = isBrewing && weightReached && timeRemaining === 0

  return (
    <section className={styles.dashboard}>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.recipeTitle}>{recipe?.name || 'Manual Brew'}</h1>
          <div className={styles.methodBadge}>
            {recipe ? recipe.method.toUpperCase() : 'MANUAL'}
          </div>
        </div>
        {recipe?.beanOrigin && (
          <p className={styles.beanOrigin}>{recipe.beanOrigin}</p>
        )}
      </div>

      {/* Stage Banner */}
      {currentStage && (
        <div className={`${styles.stageBanner} ${isResting ? styles.restingBanner : ''} ${isPouring ? styles.pouringBanner : ''}`}>
          <div className={styles.stageHeader}>
            <div className={styles.stageInfo}>
              <div className={styles.stageDot} style={{ background: isBrewing ? 'var(--success)' : 'var(--text-tertiary)' }} />
              <span className={styles.stageName}>{currentStage.name}</span>
              <span className={styles.stageTargetBadge}>Target: {formatWeight(currentCumulativeTarget)}g</span>
              {currentStage.temperature > 0 && (
                <span className={styles.stageTemp}>{currentStage.temperature}°C</span>
              )}
            </div>
            {isBrewing && (
              <div className={styles.stageCountdown}>
                <span className={styles.countdownLabel}>{isResting ? 'Rest' : 'Finish in'}</span>
                <span className={styles.countdownValue}>{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          <div className={styles.stageProgress}>
            <div className={`${styles.stageBar} ${isResting ? styles.restingBar : ''}`} style={{ width: `${stageProgress}%` }} />
          </div>
          <div className={styles.stageFooter}>
            {currentStage.notes && (
              <p className={styles.stageNote}>{currentStage.notes}</p>
            )}
            <div className={styles.stageStatusText}>
              {isPouring && <span className={styles.statusPouring}>⚡ Pouring... reach {formatWeight(currentCumulativeTarget)}g</span>}
              {isResting && <span className={styles.statusResting}>☕ Resting... wait for timer</span>}
              {isStageComplete && (
                <span className={styles.statusComplete}>
                  {currentStageIndex === stages.length - 1 ? '🎉 Brew Finished! Enjoy.' : '✅ Ready for next pour!'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Metrics */}
      <div className={styles.metricsGrid}>
        {/* Weight Display */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Weight</div>
          <div className={styles.metricValue}>
            <span className={styles.metricNumber}>{formatWeight(currentWeight)}</span>
            <span className={styles.metricUnit}>g</span>
            {targetWeight > 0 && (
              <span className={styles.metricTarget}>/ {targetWeight}g</span>
            )}
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${totalProgress}%` }} />
          </div>
          <button
            id="tare-btn"
            className={`btn btn-sm btn-ghost ${styles.tareBtn}`}
            onClick={tare}
            title="T — Tare"
          >
            ⊙ Tare
          </button>
        </div>

        {/* Timer Display */}
        <div className={`${styles.metricCard} ${styles.timerCard} ${isBrewing && !isPaused ? styles.brewing : ''}`}>
          <div className={styles.metricLabel}>Timer</div>
          <div className={styles.timerDisplay}>
            <span className={styles.timerNumber}>{formatTime(totalElapsedTime)}</span>
          </div>
          {isBrewing && isPaused && (
            <div className={`badge badge-warning ${styles.pausedBadge}`}>PAUSED</div>
          )}
        </div>

        {/* Flow Rate */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Flow Rate</div>
          <div className={styles.metricValue}>
            <span className={styles.metricNumber}>{formatWeight(currentFlowRate)}</span>
            <span className={styles.metricUnit}>g/s</span>
          </div>
          <div className={styles.metricSub}>
            {isBrewing ? 'Streaming...' : 'Idle'}
          </div>
        </div>
      </div>

      {/* Stage Timeline */}
      {stages.length > 0 && (
        <div className={styles.timeline}>
          {stages.map((stage, idx) => {
            const isActive = idx === currentStageIndex
            const isDone = idx < currentStageIndex
            const isNext = idx === currentStageIndex + 1
            return (
              <div
                key={stage.id}
                className={`${styles.timelineStep} ${isActive ? styles.activeStep : ''} ${isDone ? styles.doneStep : ''} ${isNext ? styles.nextStep : ''}`}
                title={`${stage.name}: ${stagesWithCumulative[idx].cumulativeTotal}g (Step: ${stage.targetWeight}g) / ${stage.targetSeconds}s`}
              >
                <div className={styles.stepCircle}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div className={styles.stepLabel}>{stage.name}</div>
                <div className={styles.stepMeta}>
                  {stage.targetWeight > 0 ? (
                    <span className={styles.cumulativeTarget}>{formatWeight(stagesWithCumulative[idx].cumulativeTotal)}g</span>
                  ) : `${stage.targetSeconds}s`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        {!isBrewing ? (
          <button
            id="start-brew-btn"
            className={`btn btn-primary btn-lg ${styles.startBtn}`}
            onClick={toggleBrew}
            disabled={!recipe}
          >
            <span>▶</span>
            Start Brewing
          </button>
        ) : (
          <>
            <button
              id="pause-brew-btn"
              className="btn btn-secondary btn-lg"
              onClick={isPaused ? resumeBrew : pauseBrew}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              id="next-stage-btn"
              className="btn btn-ghost btn-lg"
              onClick={nextStage}
              disabled={currentStageIndex >= stages.length - 1}
              title="Enter — Next Stage"
            >
              Next Stage →
              {isStageComplete && <span className={styles.btnPulse} />}
            </button>
            <button
              id="stop-brew-btn"
              className="btn btn-danger"
              onClick={stopBrew}
            >
              ■ Stop
            </button>
          </>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className={styles.shortcuts}>
        <span className={styles.shortcutItem}><kbd>Space</kbd> Start/Stop</span>
        <span className={styles.shortcutItem}><kbd>T</kbd> Tare</span>
        <span className={styles.shortcutItem}><kbd>Enter</kbd> Next Stage</span>
        <span className={styles.shortcutItem}><kbd>P</kbd> Pause</span>
      </div>
    </section>
  )
}
