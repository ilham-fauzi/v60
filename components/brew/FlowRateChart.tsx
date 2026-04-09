'use client'

import styles from './FlowRateChart.module.css'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts'
import type { WeightDataPoint } from '@/types'
import { useMemo } from 'react'

interface Props {
  history: WeightDataPoint[]
  targetWeight: number
  isBrewing: boolean
}

interface ChartPoint {
  time: number
  weight: number
  flowRate: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTime}>{label}s</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className={styles.tooltipRow} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toFixed(1)}{p.dataKey === 'weight' ? 'g' : ' g/s'}</strong>
        </div>
      ))}
    </div>
  )
}

export function FlowRateChart({ history, targetWeight, isBrewing }: Props) {
  const chartData: ChartPoint[] = useMemo(() => {
    // Downsample if too many points (keep last 300)
    const data = history.length > 300 ? history.slice(-300) : history
    return data.map((p) => ({
      time: Math.round(p.timestamp / 1000),
      weight: parseFloat(p.weight.toFixed(1)),
      flowRate: parseFloat(Math.max(0, p.flowRate).toFixed(2)),
    }))
  }, [history])

  const currentFlowRate = history.length > 0 ? history[history.length - 1]?.flowRate ?? 0 : 0
  const totalPoured = history.length > 0 ? history[history.length - 1]?.weight ?? 0 : 0
  const isGoodFlow = currentFlowRate >= 2.5 && currentFlowRate <= 5
  const isSlowFlow = currentFlowRate > 0 && currentFlowRate < 2.5
  const isFastFlow = currentFlowRate > 5

  return (
    <section className={styles.chartSection}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Flow Rate</h2>
          {isBrewing && <div className={styles.livePill}><div className="live-dot" />Live</div>}
        </div>
        <div className={styles.flowIndicators}>
          <div className={`${styles.flowStat} ${isGoodFlow ? styles.good : isSlowFlow ? styles.slow : isFastFlow ? styles.fast : ''}`}>
            <span className={styles.flowValue}>{currentFlowRate.toFixed(1)}</span>
            <span className={styles.flowUnit}>g/s</span>
          </div>
          <div className={styles.flowMeta}>
            {isGoodFlow && <span className={styles.flowTip}>✓ Ideal flow</span>}
            {isSlowFlow && <span className={styles.flowTip}>⚠ Pour faster</span>}
            {isFastFlow && <span className={styles.flowTip}>⚠ Pour slower</span>}
          </div>
        </div>
      </div>

      {chartData.length < 2 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <p>Start brewing to see real-time flow data</p>
        </div>
      ) : (
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#5c5955', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickFormatter={(v) => `${v}s`}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="weight"
                orientation="left"
                tick={{ fill: '#14b8a6', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                domain={[0, Math.max(targetWeight || 250, Math.max(...chartData.map((d) => d.weight), 50))]}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="flow"
                orientation="right"
                tick={{ fill: '#d97706', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                domain={[0, 10]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {targetWeight > 0 && (
                <ReferenceLine
                  y={targetWeight}
                  yAxisId="weight"
                  stroke="rgba(20,184,166,0.4)"
                  strokeDasharray="4 4"
                  label={{ value: `${targetWeight}g`, fill: '#14b8a6', fontSize: 10 }}
                />
              )}
              <Area
                yAxisId="weight"
                type="monotone"
                dataKey="weight"
                name="Weight"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#weightGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#14b8a6' }}
              />
              <Area
                yAxisId="flow"
                type="monotone"
                dataKey="flowRate"
                name="Flow Rate"
                stroke="#d97706"
                strokeWidth={1.5}
                fill="url(#flowGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#d97706' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Poured</span>
          <span className={`${styles.statValue} num`}>{totalPoured.toFixed(1)}g</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Target</span>
          <span className={`${styles.statValue} num`}>{targetWeight > 0 ? `${targetWeight}g` : '—'}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Remaining</span>
          <span className={`${styles.statValue} num`}>
            {targetWeight > 0 ? `${Math.max(0, targetWeight - totalPoured).toFixed(1)}g` : '—'}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Data Points</span>
          <span className={`${styles.statValue} num`}>{history.length}</span>
        </div>
      </div>
    </section>
  )
}
