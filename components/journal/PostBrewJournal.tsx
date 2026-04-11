'use client'

import { useState, useEffect } from 'react'
import styles from './PostBrewJournal.module.css'

interface LogEntry {
  id: string
  date: string
  recipeId: string
  recipeName: string
  method: string
  score: number // 1-10
  notes: string
  stats: {
    coffee: number
    water: number
    time: string
    tds?: number
  }
}

export function PostBrewJournal() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch('/api/sessions')
        if (!res.ok) throw new Error('Failed to fetch sessions')
        const sessions = await res.json()
        
        // Map DB sessions to LogEntry UI format
        const mappedLogs: LogEntry[] = sessions.map((s: any) => {
          const start = new Date(s.startedAt)
          const end = new Date(s.completedAt)
          const durationSec = Math.floor((end.getTime() - start.getTime()) / 1000)
          const minutes = Math.floor(durationSec / 60)
          const seconds = durationSec % 60
          
          return {
            id: s.id,
            date: start.toLocaleString(),
            recipeId: s.recipeId,
            recipeName: s.recipe?.name || 'Unknown Recipe',
            method: s.recipe?.method || 'v60',
            score: s.sensoryFeedback?.rating || 0,
            notes: s.sensoryFeedback?.notes || '',
            stats: {
              coffee: s.recipe?.coffeeGrams || 0,
              water: s.finalWeight || 0,
              time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            }
          }
        })
        
        setLogs(mappedLogs)
      } catch (err) {
        console.error('Error fetching brew history:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [])

  if (isLoading) {
    return (
      <section className={styles.journal}>
        <div className={styles.emptyState}>
          <p>Loading your brew history...</p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.journal} style={{ maxWidth: '100%' }}>
      <header className={styles.header} style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 'var(--space-1)' }}>
            Post-Brew Analytics
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
             Review extraction outcomes and sensory data
          </p>
        </div>
        <div style={{ padding: '4px 8px', background: 'rgba(0, 242, 255, 0.1)', color: 'var(--cyber-teal)', fontSize: '10px', fontWeight: 800, borderRadius: 4, letterSpacing: '0.05em' }}>
          LOCAL DB SYNCED
        </div>
      </header>

      {logs.length === 0 ? (
        <div className="v2-glass" style={{ padding: 'var(--space-8)', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)', opacity: 0.5 }}>📝</div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No extractions recorded.</p>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Initiate a formula to generate telemetry data.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {logs.map((log) => (
            <article key={log.id} className="v2-glass" style={{ padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--cyber-border)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: '2px' }}>
                    {log.date} — {log.method.toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{log.recipeName}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {log.score > 0 ? (
                    <div style={{ padding: '4px 8px', background: 'rgba(0, 242, 255, 0.1)', color: 'var(--cyber-teal)', borderRadius: 4, fontWeight: 900, fontSize: 'var(--text-lg)' }}>
                      {log.score.toFixed(1)} <span style={{ fontSize: '10px', opacity: 0.6 }}>/ 10</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                      NO SENSORY DATA
                    </div>
                  )}
                </div>
              </div>

              <div className="responsive-grid-4" style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em' }}>DOSE</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-md)' }}>{log.stats.coffee}g</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em' }}>YIELD</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-md)' }}>{log.stats.water}g</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em' }}>TIME</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-md)' }}>{log.stats.time}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em' }}>TDS</div>
                  <div style={{ fontWeight: 800, fontSize: 'var(--text-md)', color: log.stats.tds ? 'var(--cyber-teal)' : 'var(--text-tertiary)' }}>
                    {log.stats.tds ? `${log.stats.tds}%` : '--'}
                  </div>
                </div>
              </div>

              {log.notes && (
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--cyber-border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>SENSOR NOTES</div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{log.notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
