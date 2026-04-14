'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, SkipForward, RotateCcw, Thermometer, Timer, Weight, Cpu, Utensils, RefreshCw, Clock, Lock, Unlock, ArrowDown, Info } from 'lucide-react'
import { useBrewStore } from '@/stores/BrewStore'
import type { Recipe } from '@/types'

import styles from './BrewDashboardV2.module.css'

interface Props {
  recipe: Recipe | null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
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

const getActionIcon = (action?: string) => {
  switch (action) {
    case 'stir': return <Utensils size={14} />
    case 'swirl': return <RefreshCw size={14} />
    case 'steep': return <Clock size={14} />
    case 'open-valve': return <Unlock size={14} />
    case 'close-valve': return <Lock size={14} />
    case 'press': return <ArrowDown size={14} />
    default: return null
  }
}

function LiquidPhaseOverlay({ 
  elapsedTime, 
  targetSeconds, 
  targetWeight,
  stageName,
  action,
  notes,
  reverseDrawdownEnabled,
  recipeName,
  totalTargetWeight,
  currentWeight,
  currentFlowRate,
  totalProgress,
  totalElapsedTime,
  temperature,
  isPaused,
  stopBrew,
  resumeBrew,
  pauseBrew,
  nextStage,
  stages,
  currentStageIndex
}: { 
  elapsedTime: number, 
  targetSeconds: number, 
  targetWeight: number,
  stageName: string,
  action?: string,
  notes?: string,
  reverseDrawdownEnabled?: boolean,
  recipeName: string,
  totalTargetWeight: number,
  currentWeight: number,
  currentFlowRate: number,
  totalProgress: number,
  totalElapsedTime: number,
  temperature: number,
  isPaused: boolean,
  stopBrew: () => void,
  resumeBrew: () => void,
  pauseBrew: () => void,
  nextStage: () => void,
  stages: any[],
  currentStageIndex: number
}) {
  const activeStageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeStageRef.current) {
      activeStageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [currentStageIndex])

  const isDrawdown = stageName.toLowerCase().includes('drawdown')
  const percentage = Math.min(100, (elapsedTime / targetSeconds) * 100)
  const liquidFillHeight = (isDrawdown && reverseDrawdownEnabled) ? Math.max(0, 100 - percentage) : percentage
  
  const arcRadius = 145;
  const arcCircumference = 2 * Math.PI * arcRadius;
  // Make the ring fill according to current stage percentage
  const arcOffset = arcCircumference - (percentage / 100) * arcCircumference;
  
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

      <div className={styles.mobileExtractionUi}>
        {/* Header */}
        <div className={styles.extractionHeader}>
          <div className={styles.extractionHeaderLeft}>
            <div className={styles.extractionActiveLabel}>EXTRACTION ACTIVE</div>
            <div className={styles.extractionRecipeName}>{recipeName}</div>
          </div>
          <div className={styles.extractionHeaderRight}>
            <div className={styles.extractionTargetLabel}>TARGET</div>
            <div className={styles.extractionTargetWeight}>{totalTargetWeight.toFixed(1)}g</div>
          </div>
        </div>

        {/* Mobile Timeline Strip */}
        <div className={styles.mobileTimelineCtn} style={{ marginTop: 'var(--space-8)' }}>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {stages.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isPast = idx < currentStageIndex;
              return (
                <div key={idx} style={{ flex: '0 0 auto', minWidth: '95px' }} ref={isActive ? activeStageRef : null}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 12 }}>
                      {isActive ? (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid cyan', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'cyan' }} />
                        </div>
                      ) : (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isPast ? 'cyan' : 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                    
                    <div style={{ fontWeight: 800, fontSize: '9px', letterSpacing: '0.1em', color: isActive ? 'cyan' : 'var(--text-tertiary)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{stage.targetSeconds}s</span>
                      <span>•</span>
                      <span>{stage.targetWeight}g</span>
                    </div>
                    {isActive && (
                      <div style={{ marginTop: '2px', width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                        <motion.div 
                          style={{ height: '100%', background: 'cyan', borderRadius: 2 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ ease: 'linear', duration: 1 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Ring */}
        <div className={styles.extractionCenter}>
          <div className={styles.extractionRingContainer}>
            <svg width="100%" height="100%" viewBox="0 0 320 320" className={styles.extractionSvg} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFFF" />
                  <stop offset="100%" stopColor="#00bfff" />
                </linearGradient>
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <circle cx="160" cy="160" r={arcRadius} stroke="rgba(0, 255, 255, 0.05)" strokeWidth="16" fill="none" />
              <circle 
                cx="160" 
                cy="160" 
                r={arcRadius} 
                stroke="url(#neonGradient)" 
                strokeWidth="16" 
                fill="none" 
                strokeLinecap="round" 
                strokeDasharray={arcCircumference} 
                strokeDashoffset={arcOffset} 
                style={{ transition: 'stroke-dashoffset 1s linear' }} 
                filter="url(#neonGlow)"
              />
            </svg>
            <div className={styles.extractionRingContent}>
              <div className={styles.extractionLiveWeightLabel} style={{ textTransform: 'uppercase' }}>{stageName}</div>
              <div className={styles.extractionLiveWeightValue} style={{ color: 'var(--cyber-amber)', fontSize: '4rem' }}>
                {formatTime(Math.max(0, targetSeconds - elapsedTime))}
              </div>
              <div className={styles.extractionRingStats}>
                <div className={styles.extractionRingStatCol}>
                  <div className={styles.extractionRingStatLabel}>STAGE TARGET</div>
                  <div className={styles.extractionRingStatValue}>{targetWeight.toFixed(1)}g</div>
                </div>
                <div className={styles.extractionRingStatDivider} />
                <div className={styles.extractionRingStatCol}>
                  <div className={styles.extractionRingStatLabel}>STAGE ELAPSED</div>
                  <div className={styles.extractionRingStatValue} style={{ color: '#fff' }}>{formatTime(elapsedTime)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Indicators - if available */}
        {action && action !== 'none' && (
           <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translate(-50%, 0)', zIndex: 42 }}>
             <motion.div 
               className={styles.actionIndicator}
               animate={{ 
                 scale: [1, 1.05, 1],
                 boxShadow: [
                   '0 0 0px var(--cyber-amber-glow)',
                   '0 0 20px var(--cyber-amber-glow)',
                   '0 0 0px var(--cyber-amber-glow)'
                 ]
               }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
             >
                <div className={styles.actionIconWrapper}>
                  {getActionIcon(action)}
                </div>
                <span className={styles.actionText}>{action.replace('-', ' ')} NOW</span>
             </motion.div>
           </div>
        )}

        {/* Bottom Stats */}
        <div className={styles.extractionBottomStats}>
          <div className={styles.extractionBottomBox}>
            <div className={styles.extractionBottomBoxLabel}>TEMPERATURE</div>
            <div className={styles.extractionBottomBoxValue}>{temperature}°C</div>
          </div>
          <div className={styles.extractionBottomBox}>
            <div className={styles.extractionBottomBoxLabel}>TIME ELAPSED</div>
            <div className={styles.extractionBottomBoxValue}>{formatTime(totalElapsedTime)}</div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className={styles.mobileControlsCtn}>
          <button className={styles.mobileControlBtnStop} onClick={stopBrew}>
            <div className={styles.mobileControlIconStop} />
            <span>STOP</span>
          </button>
          <button className={styles.mobileControlBtnPause} onClick={isPaused ? resumeBrew : pauseBrew}>
            {isPaused ? <Play fill="#000" size={24} /> : <Pause fill="#000" size={24} />}
            <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>
          <button className={styles.mobileControlBtnSkip} onClick={nextStage}>
            <SkipForward fill="#aaa" size={20} />
            <span>SKIP</span>
          </button>
        </div>
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

  const [mounted, setMounted] = React.useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef(tick)
  const activeTimelineStageRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (activeTimelineStageRef.current) {
      activeTimelineStageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [currentStageIndex])

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

  if (!mounted) return <DashboardSkeleton />

  return (
    <div className={`${styles.container} ${isBrewing ? styles.hudMode : ''}`}>
      {/* Header Info */}
      <div className={styles.hudHeader} style={{ padding: 'var(--space-2) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
             <div style={{ color: 'var(--cyber-amber)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>
              MISSION PROFILE
            </div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1 }}>
              {recipe?.name || 'Ethiopia Yirgacheffe'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
              <span style={{ color: 'var(--cyber-teal)', fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em' }}>{recipe?.method?.toUpperCase() || 'V60'} EXTRACTION</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>//</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', fontWeight: 700 }}>{recipe?.beanOrigin || 'SINGLE ORIGIN'}</span>
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
      <div className={`v2-glass ${styles.hudTimeline}`} style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)' }}>
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
              ref={idx === currentStageIndex ? activeTimelineStageRef : null}
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
                      transition={{ ease: 'linear', duration: 1 }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Control Strip */}
      <div className={styles.controlStrip} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        {!isBrewing ? (
          <>
            {recipe?.iceGrams && recipe.iceGrams > 0 ? (
              <div style={{ background: 'rgba(255, 191, 0, 0.1)', border: '1px solid var(--cyber-amber)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', maxWidth: '400px', textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', color: 'var(--cyber-amber)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
                  <Info size={16} /> PRE-BREW CHECKLIST
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  This is an Iced recipe. Add <strong style={{ color: '#fff' }}>~{recipe.iceGrams}g of ice</strong> to your server and <strong>tare your scale to 0g</strong> before initiating the brew cycle.
                </div>
              </div>
            ) : null}
            <button 
              className="btn btn-primary" 
              style={{ height: 64, padding: '0 40px', background: 'var(--cyber-amber)', color: '#000', fontSize: 'var(--text-lg)', fontWeight: 800, borderRadius: 'var(--radius-xl)' }}
              onClick={toggleBrew}
            >
              <Play fill="#000" size={24} /> INITIATE BREW CYCLE
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-8)' }}>
            <button style={{ 
              width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'var(--text-tertiary)', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }} onClick={stopBrew}>
              <Square fill="currentColor" size={14} />
              <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.15em' }}>STOP</span>
            </button>
            <button style={{ 
               width: 90, height: 90, borderRadius: '50%', background: 'var(--cyber-amber)', border: 'none', boxShadow: '0 0 30px rgba(255, 191, 0, 0.3)',
               display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#000', cursor: 'pointer',
               transition: 'all 0.2s ease'
            }} onClick={isPaused ? resumeBrew : pauseBrew}>
              {isPaused ? <Play fill="#000" size={32} /> : <Pause fill="#000" size={32} />}
              <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.1em' }}>{isPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>
            <button style={{ 
              width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: 'var(--text-tertiary)', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }} onClick={nextStage}>
              <SkipForward fill="currentColor" size={14} />
              <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.15em' }}>SKIP</span>
            </button>
          </div>
        )}
      </div>

      {/* Immersive Mobile Liquid Tracker */}
      {isBrewing && currentStage && (
        <LiquidPhaseOverlay 
          elapsedTime={elapsedTime}
          targetSeconds={currentStage.targetSeconds}
          targetWeight={currentStage.targetWeight}
          stageName={currentStage.name}
          action={currentStage.action}
          notes={currentStage.notes}
          reverseDrawdownEnabled={reverseDrawdownEnabled}
          recipeName={recipe?.name || 'Ethiopian Yirgacheffe'}
          totalTargetWeight={targetWeight}
          currentWeight={currentWeight}
          currentFlowRate={currentFlowRate}
          totalProgress={totalProgress}
          totalElapsedTime={totalElapsedTime}
          temperature={recipe?.temperature ?? 93}
          isPaused={isPaused}
          stopBrew={stopBrew}
          resumeBrew={resumeBrew}
          pauseBrew={pauseBrew}
          nextStage={nextStage}
          stages={stagesWithCumulative}
          currentStageIndex={currentStageIndex}
        />
      )}
    </div>
  )
}
