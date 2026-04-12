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

function LiquidPhaseOverlay({ 
  elapsedTime, 
  targetSeconds, 
  targetWeight,
  stageName,
  reverseDrawdownEnabled
}: { 
  elapsedTime: number, 
  targetSeconds: number, 
  targetWeight: number,
  stageName: string,
  reverseDrawdownEnabled?: boolean
}) {
  const isDrawdown = stageName.toLowerCase().includes('drawdown')
  const percentage = Math.min(100, (elapsedTime / targetSeconds) * 100)
  const liquidFillHeight = (isDrawdown && reverseDrawdownEnabled) ? Math.max(0, 100 - percentage) : percentage
  const remaining = Math.max(0, targetSeconds - Math.floor(elapsedTime))
  
  // Static random seeds for bubble animation to prevent reshuffling on every frame update
  const bubbles = React.useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      startX: Math.random() * 100,
      endX: (Math.random() - 0.5) * 20 + Math.random() * 100,
      duration: 1.5 + Math.random() * 3,
      delay: Math.random() * 2,
      size: 4 + Math.random() * 10,
    }))
  }, [])

  return (
    <div className={styles.liquidOverlayCtn}>
      <motion.div 
        className={styles.liquidWave}
        initial={{ height: 0 }}
        animate={{ height: `${liquidFillHeight}%` }}
        transition={{ ease: "linear", duration: 1 }}
      >
        {/* Animated surface waves */}
        <div className={styles.waveSurface2} />
        <div className={styles.waveSurface} />
        
        {/* Rising Bubbles */}
        <div className={styles.bubblesCtn}>
           {bubbles.map((b, i) => (
             <motion.div
               key={i}
               className={styles.bubble}
               initial={{ y: '20px', opacity: 0, x: `${b.startX}vw` }}
               animate={{ 
                 y: '-100vh', 
                 opacity: [0, 1, 0.8, 0],
                 x: `${b.endX}vw` 
               }}
               transition={{
                 duration: b.duration,
                 repeat: Infinity,
                 delay: b.delay,
                 ease: "easeIn"
               }}
               style={{
                 width: b.size,
                 height: b.size,
               }}
             />
           ))}
        </div>
      </motion.div>

      <div className={styles.liquidTimerRing}>
        <motion.span 
          key={remaining}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.liquidTimerNumber}
        >
          {remaining}
        </motion.span>
        <span className={styles.liquidTimerLabel}>{stageName}</span>
        <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--cyber-amber)', marginTop: '8px', letterSpacing: '0.05em', lineHeight: 1 }}>
          {targetWeight}g
        </span>
      </div>
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
    reverseDrawdownEnabled,
    setReverseDrawdownEnabled,
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

  // Screen Wake Lock API to prevent device from sleeping while brewing
  useEffect(() => {
    let wakeLock: any = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isBrewing) {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.warn(`Wake Lock error: ${err}`)
      }
    }

    if (isBrewing) {
      requestWakeLock()
    } else if (wakeLock) {
      wakeLock.release().then(() => { wakeLock = null }).catch(() => {})
    }

    // Re-request wake lock if tab becomes visible again
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible' && isBrewing) {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) wakeLock.release().catch(() => {})
    }
  }, [isBrewing])

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
    const isDrawdown = stage.name.toLowerCase().includes('drawdown')
    return { ...stage, cumulativeTotal: stage.targetWeight, targetWeight: isDrawdown ? 0 : stage.targetWeight }
  })
  const currentStage = stagesWithCumulative[currentStageIndex]
  const currentCumulativeTarget = currentStage?.cumulativeTotal ?? 0
  const totalProgress = targetWeight > 0 ? (currentWeight / targetWeight) * 100 : 0
  const isPouring = isBrewing && currentFlowRate > 0.1

  return (
    <div className={`${styles.container} ${isBrewing ? styles.hudMode : ''}`}>
      {/* Header Info */}
      <div className={styles.hudHeader} style={{ padding: 'var(--space-2) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
             <div style={{ color: 'var(--cyber-amber)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
              ORIGIN SELECT
            </div>
            <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {recipe?.name || 'Ethiopia Yirgacheffe'} {recipe?.method || 'V60'}
              <span style={{ color: 'var(--cyber-amber)' }}>⤢</span>
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-2)', 
                background: 'rgba(255,255,255,0.05)', 
                padding: '4px 10px', 
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              onClick={() => setReverseDrawdownEnabled(!reverseDrawdownEnabled)}
              title="Toggle Reverse Drawdown"
            >
              <div style={{ width: 12, height: 12, borderRadius: 2, background: reverseDrawdownEnabled ? 'var(--cyber-teal)' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: reverseDrawdownEnabled ? 'var(--cyber-teal)' : 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                REVERSE DRAWDOWN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metric Cockpit */}
      <div className={styles.metricsGrid}>
        {/* Weight Panel */}
        <div className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>REAL-TIME WEIGHT</div>
            <Weight size={16} color="var(--cyber-amber)" />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
            <span className={styles.metricValue}>
              {currentWeight.toFixed(1)}
            </span>
            <span style={{ fontSize: 'var(--text-2xl)', color: 'var(--cyber-amber)', marginLeft: 'var(--space-2)', fontWeight: 800 }}>g</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: 4, borderRadius: 2, position: 'relative' }}>
              <motion.div 
                animate={{ width: `${totalProgress}%` }}
                style={{ height: '100%', background: 'var(--cyber-amber)', boxShadow: 'var(--cyber-glow-amber)', borderRadius: 2 }} 
              />
            </div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', fontWeight: 600 }}>Target {targetWeight}g</span>
          </div>
        </div>

        {/* Right sub-grid for Timer and Flow Rate */}
        <div className={styles.hudMetricsRight} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Timer Panel */}
          <div className="v2-glass" style={{ 
            padding: 'var(--space-5)', 
            borderRadius: 'var(--radius-xl)', 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>MASTER TIMER</div>
            <span style={{ 
                fontSize: '3.5rem', 
                fontWeight: 800, 
                lineHeight: 1,
                color: isBrewing && !isPaused ? 'var(--cyber-teal)' : '#fff',
                textShadow: isBrewing && !isPaused ? 'var(--cyber-glow-teal)' : 'none'
              }}>
                {formatTime(totalElapsedTime)}
            </span>
          </div>

          {/* Flow Rate Panel */}
          <div className="v2-glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>FLOW RATE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
                {currentFlowRate.toFixed(1)}
              </span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginLeft: 'var(--space-2)', fontWeight: 600 }}>g/s</span>
            </div>
            <div style={{ display: 'flex', gap: 2, height: 24, alignItems: 'flex-end' }}>
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div 
                  key={i}
                  animate={{ height: isBrewing ? 4 + Math.random() * 20 : 4 }}
                  style={{ flex: 1, background: isBrewing && !isPaused ? 'var(--cyber-teal)' : 'rgba(255,255,255,0.1)', borderRadius: 1 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Strip */}
      <div className="v2-glass hudTimeline" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
            <span style={{ color: 'var(--cyber-amber)' }}>≈</span> Extraction Phases
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em' }}>
            PHASE {currentStageIndex + 1} OF {stagesWithCumulative.length || 1}
          </div>
        </div>
        
        {/* Phase progress bar */}
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: 4, borderRadius: 2, position: 'relative', marginBottom: 'var(--space-4)' }}>
          <motion.div 
            style={{ 
              width: `${Math.min(100, (currentStageIndex + 1) / (stagesWithCumulative.length || 1) * 100)}%`,
              height: '100%', 
              background: 'var(--cyber-amber)', 
              boxShadow: 'var(--cyber-glow-amber)', 
              borderRadius: 2 
            }} 
          />
        </div>

        <div className="hide-scrollbar" style={{ display: 'flex', gap: 'var(--space-6)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
          {stagesWithCumulative.map((stage, idx) => (
            <div 
              key={idx} 
              style={{ flex: '0 0 auto', minWidth: '110px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {/* Active indicator dot */}
                <div style={{ display: 'flex', alignItems: 'center', height: 16 }}>
                  {idx === currentStageIndex ? (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--cyber-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cyber-amber)' }} />
                    </div>
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: idx < currentStageIndex ? 'var(--cyber-amber)' : 'rgba(255,255,255,0.2)' }} />
                  )}
                </div>
                
                <div style={{ 
                  fontWeight: 800, 
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: idx === currentStageIndex ? 'var(--cyber-amber)' : 'var(--text-tertiary)',
                  textTransform: 'uppercase'
                }}>
                  {stage.name}
                </div>
                
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)'
                }}>
                  <span>{stage.targetSeconds}s</span>
                  <span>•</span>
                  <span>{stage.targetWeight}g</span>
                  {idx === currentStageIndex && isBrewing && (
                    <span style={{ marginLeft: 'var(--space-2)', fontSize: '8px', padding: '2px 4px', background: 'rgba(255, 191, 0, 0.1)', color: 'var(--cyber-amber)', borderRadius: 2 }}>ACTIVE</span>
                  )}
                </div>
                
                {idx === currentStageIndex && isBrewing && (
                  <div style={{ marginTop: 'var(--space-2)', width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <motion.div 
                      style={{ height: '100%', background: 'var(--cyber-amber)', borderRadius: 2 }}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(() => {
                          const isDrawdown = stage.name.toLowerCase().includes('drawdown')
                          const p = Math.min(100, (elapsedTime / stage.targetSeconds) * 100)
                          return (isDrawdown && reverseDrawdownEnabled) ? 100 - p : p
                        })()}%` 
                      }}
                      transition={{ ease: 'linear' }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Strip */}
      <div className={styles.controlStrip} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-4)', marginTop: '0' }}>
        {!isBrewing ? (
          <button 
            className="btn btn-primary" 
            style={{ height: 64, padding: '0 40px', background: 'var(--cyber-amber)', color: '#000', fontSize: 'var(--text-lg)', fontWeight: 800, borderRadius: 'var(--radius-xl)' }}
            onClick={toggleBrew}
          >
            <Play fill="#000" size={24} /> INITIATE BREW CYCLE
          </button>
        ) : (
          <>
            <button style={{ 
              width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-secondary)', cursor: 'pointer'
            }} onClick={stopBrew}>
              <Square fill="currentColor" size={16} />
              <span style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.1em' }}>STOP</span>
            </button>
            <button style={{ 
               width: 80, height: 80, borderRadius: 'var(--radius-xl)', background: 'var(--cyber-amber)', border: 'none', boxShadow: 'var(--cyber-glow-amber)',
               display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#000', cursor: 'pointer'
            }} onClick={isPaused ? resumeBrew : pauseBrew}>
              {isPaused ? <Play fill="#000" size={28} /> : <Pause fill="#000" size={28} />}
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em' }}>{isPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>
            <button style={{ 
              width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-secondary)', cursor: 'pointer'
            }} onClick={nextStage}>
              <SkipForward fill="currentColor" size={16} />
              <span style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.1em' }}>SKIP</span>
            </button>
          </>
        )}
      </div>

      {/* Immersive Mobile Liquid Tracker */}
      {isBrewing && currentStage && (
        <LiquidPhaseOverlay 
          elapsedTime={elapsedTime}
          targetSeconds={currentStage.targetSeconds}
          targetWeight={currentStage.targetWeight}
          stageName={currentStage.name}
          reverseDrawdownEnabled={reverseDrawdownEnabled}
        />
      )}
    </div>
  )
}
