'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface RadarData {
  label: string
  value: number // 0 to 1
}

const DEFAULT_DATA: RadarData[] = [
  { label: 'Sweetness', value: 0.8 },
  { label: 'Acidity', value: 0.6 },
  { label: 'Bitterness', value: 0.3 },
  { label: 'Body', value: 0.7 },
  { label: 'Aftertaste', value: 0.5 },
]

export function RadarFlavorChart({ data = DEFAULT_DATA }: { data?: RadarData[] }) {
  const size = 300
  const center = size / 2
  const radius = size * 0.35
  const angleStep = (Math.PI * 2) / data.length

  const getPoints = (isOutline = false) => {
    return data.map((d, i) => {
      const val = isOutline ? 1 : d.value
      const angle = i * angleStep - Math.PI / 2
      const x = center + radius * val * Math.cos(angle)
      const y = center + radius * val * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <div className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
      <div className="cyber-panel-header">Flavor Radar</div>
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: 'drop-shadow(0 0 10px rgba(0, 242, 255, 0.1))' }}>
        {/* Background Grid */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <polygon
            key={i}
            points={data.map((_, idx) => {
              const angle = idx * angleStep - Math.PI / 2
              return `${center + radius * r * Math.cos(angle)},${center + radius * r * Math.sin(angle)}`
            }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data Shape */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          points={getPoints()}
          fill="rgba(0, 242, 255, 0.1)"
          stroke="var(--cyber-teal)"
          strokeWidth="2"
          className="glow-teal"
        />

        {/* Labels */}
        {data.map((d, i) => {
          const angle = i * angleStep - Math.PI / 2
          const labelDist = radius + 25
          const x = center + labelDist * Math.cos(angle)
          const y = center + labelDist * Math.sin(angle)
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize="10"
              fill="var(--text-tertiary)"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {d.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
