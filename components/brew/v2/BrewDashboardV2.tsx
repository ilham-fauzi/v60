'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, SkipForward, RotateCcw, Thermometer, Timer, Weight, Cpu } from 'lucide-react'
import { useBrewStore } from '@/stores/BrewStore'
import type { Recipe } from '@/types'

import styles from './BrewDashboardV2.module.css'

interface Props {
  recipe: Recipe | null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function DashboardSkeleton() {
  return (
    <div className={styles.container} data-loading="true">
      <div className={`v2-glass ${styles.skeletonHeader}`} />
      <div className={styles.skeletonGrid}>
        <div className={`v2-glass ${styles.skeletonMetric}`} />
        <div className={`v2-glass ${styles.skeletonMetric}`} />
        <div className={`v2-glass ${styles.skeletonMetric}`} />
      </div>
      <div className={`v2-glass ${styles.skeletonControl}`} />
      <div className={`v2-glass ${styles.skeletonTimeline}`} />
    </div>
  )
}

export function BrewDashboardV2({ recipe }: Props) {
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); toggleBrew() }
      if (e.code === 'KeyT') { e.preventDefault(); tare() }
      if (e.code === 'Enter') { e.preventDefault(); if (isBrewing) nextStage() }
    },
    [isBrewing, toggleBrew, tare, nextStage]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const stages = recipe?.stages ?? []
  const stagesWithCumulative = stages.map(stage => {
    return { ...stage, cumulativeTotal: stage.targetWeight }
  })
  const currentStage = stagesWithCumulative[currentStageIndex]
  const currentCumulativeTarget = currentStage?.cumulativeTotal ?? 0
  const totalProgress = targetWeight > 0 ? (currentWeight / targetWeight) * 100 : 0
  const isPouring = isBrewing && currentFlowRate > 0.1

  return (
    <div className={styles.container}>
      {/* Header Info */}
      <div className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 'var(--space-1)' }}>
              {recipe?.name || 'Manual Session'}
            </h1>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Thermometer size={14} /> {recipe?.temperature || 93}°C Target • {recipe?.method || 'V60'} Precision
            </div>
          </div>
          <div className="v2-glass" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', border: '1px solid var(--cyber-teal)', color: 'var(--cyber-teal)', textShadow: 'var(--cyber-glow-teal)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, letterSpacing: '0.1em' }}>PRECISION MODE</span>
          </div>
        </div>
      </div>

      {/* Main Metric Cockpit */}
      <div className={styles.metricsGrid}>
        {/* Weight Panel */}
        <div className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
          <div className="cyber-panel-header"><Weight size={12} /> Live Weight</div>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span className={styles.metricValue}>
              {currentWeight.toFixed(1)}
            </span>
            <span style={{ fontSize: 'var(--text-xl)', color: 'var(--text-tertiary)', marginLeft: 'var(--space-2)' }}>g</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', height: 4, borderRadius: 2, position: 'relative' }}>
            <motion.div 
              animate={{ width: `${totalProgress}%` }}
              style={{ height: '100%', background: 'var(--cyber-amber)', boxShadow: 'var(--cyber-glow-amber)' }} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Target: {targetWeight}g</span>
            <button onClick={tare} className="btn btn-xs btn-ghost" style={{ fontSize: '10px', height: '24px', minHeight: '24px' }}>
              <RotateCcw size={10} /> TARE [T]
            </button>
          </div>
          {isPouring && (
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'radial-gradient(circle at top right, rgba(255, 191, 0, 0.15), transparent)' }} 
            />
          )}
        </div>

        {/* Timer Panel */}
        <div className="v2-glass" style={{ 
          padding: 'var(--space-6)', 
          borderRadius: 'var(--radius-xl)', 
          border: isBrewing && !isPaused ? '1px solid rgba(0, 242, 255, 0.3)' : '1px solid var(--cyber-border)',
          transition: 'border-color 0.3s ease'
        }}>
          <div className="cyber-panel-header"><Timer size={12} /> Master Time</div>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span className={`${styles.metricValue}`} style={{ 
              color: isBrewing && !isPaused ? 'var(--cyber-teal)' : '#fff',
              textShadow: isBrewing && !isPaused ? 'var(--cyber-glow-teal)' : 'none'
            }}>
              {formatTime(totalElapsedTime)}
            </span>
          </div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
            Phase: {currentStage?.name || 'Idle'}
          </div>
        </div>

        {/* Flow Rate Panel */}
        <div className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)' }}>
          <div className="cyber-panel-header"><Cpu size={12} /> Flow Rate</div>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span className={styles.metricValue}>
              {currentFlowRate.toFixed(1)}
            </span>
            <span style={{ fontSize: 'var(--text-xl)', color: 'var(--text-tertiary)', marginLeft: 'var(--space-2)' }}>g/s</span>
          </div>
          <div style={{ display: 'flex', gap: 2, height: 16, alignItems: 'flex-end' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: isBrewing ? 4 + Math.random() * 12 : 4 }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 1 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Control Strip */}
      <div className={`v2-glass ${styles.controlStrip}`} style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)' }}>
        {!isBrewing ? (
          <button 
            className="btn btn-primary" 
            style={{ flex: 1, height: 56, background: 'var(--cyber-amber)', color: '#000', fontSize: 'var(--text-lg)', fontWeight: 800 }}
            onClick={toggleBrew}
          >
            <Play fill="#000" size={20} /> INITIATE BREW CYCLE
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" style={{ flex: 1, height: 56 }} onClick={isPaused ? resumeBrew : pauseBrew}>
              {isPaused ? <Play size={20} /> : <Pause size={20} />} {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
            <button className="btn btn-ghost" style={{ flex: 1, height: 56 }} onClick={nextStage}>
              <SkipForward size={20} /> NEXT PHASE
            </button>
            <button className="btn btn-danger" style={{ width: 120, height: 56 }} onClick={stopBrew}>
              <Square fill="currentColor" size={20} /> STOP
            </button>
          </>
        )}
      </div>

      {/* Timeline Strip */}
      <div className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)' }}>
        <div className="cyber-panel-header">Extraction Sequence</div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
          {stagesWithCumulative.map((stage, idx) => (
            <motion.div 
              key={idx} 
              initial={false}
              whileHover={{ 
                y: -8, 
                opacity: 1,
                backgroundColor: 'rgba(0, 242, 255, 0.15)',
                borderColor: 'var(--cyber-teal)',
                boxShadow: '0 8px 25px rgba(0, 242, 255, 0.4)',
                filter: 'grayscale(0) brightness(1.2)'
              }}
              style={{ 
                minWidth: 160, 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-lg)',
                background: idx === currentStageIndex 
                  ? 'rgba(0, 242, 255, 0.08)' 
                  : idx < currentStageIndex 
                    ? 'rgba(255, 255, 255, 0.02)' 
                    : 'transparent',
                border: idx === currentStageIndex 
                  ? '1px solid rgba(0, 242, 255, 0.3)' 
                  : idx < currentStageIndex
                    ? '1px solid rgba(255, 255, 255, 0.05)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                opacity: idx === currentStageIndex ? 1 : idx < currentStageIndex ? 0.4 : 0.2,
                filter: idx < currentStageIndex ? 'grayscale(1) brightness(0.8)' : 'none',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                fontSize: '10px', 
                color: idx === currentStageIndex ? 'var(--cyber-teal)' : 'var(--text-tertiary)', 
                fontWeight: 800, 
                marginBottom: 'var(--space-1)',
                letterSpacing: '0.05em'
              }}>
                {idx < currentStageIndex ? 'PAST PHASE' : `0${idx + 1} // ${stage.targetSeconds}S`}
              </div>
              <div style={{ 
                fontWeight: 800, 
                fontSize: 'var(--text-sm)',
                color: idx === currentStageIndex ? '#fff' : 'var(--text-tertiary)',
                textDecoration: idx < currentStageIndex ? 'line-through' : 'none',
                textDecorationColor: 'rgba(255,255,255,0.1)'
              }}>
                {stage.name}
              </div>
              <div style={{ 
                fontSize: 'var(--text-xs)', 
                color: idx === currentStageIndex ? 'var(--cyber-teal)' : 'var(--text-tertiary)',
                marginTop: '2px',
                opacity: idx < currentStageIndex ? 0.5 : 1
              }}>
                {stage.cumulativeTotal}g target
              </div>
              
              {/* Stage Outline Progress */}
              {idx === currentStageIndex && isBrewing && (
                <svg 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    pointerEvents: 'none',
                    overflow: 'visible'
                  }}
                >
                  <motion.rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    rx="var(--radius-lg)"
                    fill="none"
                    stroke="var(--cyber-teal)"
                    strokeWidth="2"
                    strokeDasharray="500" 
                    initial={{ strokeDashoffset: 500 }}
                    animate={{ strokeDashoffset: 500 - (500 * Math.min(1, elapsedTime / stage.targetSeconds)) }}
                    transition={{ ease: 'linear' }}
                    style={{ filter: 'drop-shadow(0 0 6px var(--cyber-teal))' }}
                  />
                </svg>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
