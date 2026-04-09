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
    <section className={styles.journal}>
      <header className={styles.header}>
        <h2 className={styles.title}>Dial-In Journal</h2>
        <div style={{ fontSize: '10px', color: 'var(--cyber-teal)', fontWeight: 800 }}>SQLITE PERSISTED</div>
      </header>

      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <p>No brews recorded yet.</p>
          <span className={styles.emptySub}>Start a brewing session to see your history here.</span>
        </div>
      ) : (
        <div className={styles.logList}>
          {logs.map((log) => (
            <article key={log.id} className={styles.logCard}>
              <div className={styles.logHeader}>
                <div className={styles.logMeta}>
                  <div className={styles.methodIcon}>
                    {log.method === 'v60' ? '🫗' : log.method === 'aeropress' ? '⬆️' : '☕'}
                  </div>
                  <div>
                    <h3 className={styles.recipeName}>{log.recipeName}</h3>
                    <div className={styles.date}>{log.date}</div>
                  </div>
                </div>
                <div className={styles.scoreBadge}>
                  {log.score > 0 ? (
                    <>
                      {log.score.toFixed(1)} <span className={styles.scoreMax}>/ 10</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>NO RATING</span>
                  )}
                </div>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <span className={styles.sVal}>{log.stats.coffee}g</span>
                  <span className={styles.sKey}>In</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.sVal}>{log.stats.water}g</span>
                  <span className={styles.sKey}>Out</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.sVal}>{log.stats.time}</span>
                  <span className={styles.sKey}>Time</span>
                </div>
              </div>

              {log.notes && (
                <div className={styles.notes}>
                  <span className={styles.notesIcon}>💡</span>
                  <p>{log.notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
