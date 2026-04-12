'use client'

import { useJournalStore } from '@/stores/JournalStore'
import styles from './PostBrewJournal.module.css'

export function PostBrewJournal() {
  const logs = useJournalStore((state) => state.logs)

  if (logs.length === 0) {
    return (
      <section className={styles.journal} style={{ maxWidth: '100%' }}>
        <header className={styles.header} style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 'var(--space-1)' }}>
              History
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
               Your brewing journey starts here
            </p>
          </div>
          <div style={{ padding: '4px 8px', background: 'rgba(0, 242, 255, 0.1)', color: 'var(--cyber-teal)', fontSize: '10px', fontWeight: 800, borderRadius: 4, letterSpacing: '0.05em' }}>
            LOCAL DB SYNCED
          </div>
        </header>
        <div className="v2-glass" style={{ padding: 'var(--space-8)', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)', opacity: 0.5 }}>📝</div>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No extractions recorded.</p>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Initiate a formula to generate telemetry data.</span>
        </div>
      </section>
    )
  }

  const latestLog = logs[0]
  const olderLogs = logs.slice(1)

  return (
    <section className={styles.journal} style={{ maxWidth: '100%' }}>
      <header className={styles.header} style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 'var(--space-1)' }}>
            History
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
             Review extraction outcomes and sensory data
          </p>
        </div>
        <div style={{ padding: '4px 8px', background: 'rgba(0, 242, 255, 0.1)', color: 'var(--cyber-teal)', fontSize: '10px', fontWeight: 800, borderRadius: 4, letterSpacing: '0.05em' }}>
          LOCAL DB SYNCED
        </div>
      </header>

      {/* Hero Card for Latest Brew */}
      <article className="v2-glass" style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-2xl)', border: '1px solid rgba(0, 242, 255, 0.3)', marginBottom: 'var(--space-6)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background element */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'radial-gradient(circle, rgba(0,242,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ padding: '2px 6px', background: 'var(--cyber-teal)', color: '#000', fontSize: '10px', fontWeight: 800, borderRadius: 4, letterSpacing: '0.05em' }}>LATEST</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                {latestLog.date} — {latestLog.method.toUpperCase()}
              </span>
            </div>
            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{latestLog.recipeName}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
             {latestLog.score > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: 'var(--cyber-teal)', lineHeight: 1 }}>{latestLog.score.toFixed(1)}</div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>SENSORY SCORE</div>
                </div>
              ) : (
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-tertiary)', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                  UNRATED
                </div>
              )}
          </div>
        </div>

        <div className="responsive-grid-4" style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>DOSE</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>{latestLog.stats.coffee}<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>g</span></div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>YIELD</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>{latestLog.stats.water.toFixed(0)}<span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>g</span></div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>TIME</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)' }}>{latestLog.stats.time}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>TDS</div>
            <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: latestLog.stats.tds ? 'var(--cyber-teal)' : 'var(--text-tertiary)' }}>
              {latestLog.stats.tds ? `${latestLog.stats.tds}%` : '--'}
            </div>
          </div>
        </div>
        
        {latestLog.notes && (
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', letterSpacing: '0.05em' }}>SENSOR TRACE</div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>"{latestLog.notes}"</p>
          </div>
        )}
      </article>

      {/* List for Older Brews */}
      {olderLogs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: 'var(--space-2)', marginTop: 'var(--space-2)', paddingLeft: 'var(--space-1)' }}>PREVIOUS EXTRACTIONS</h3>
          {olderLogs.map((log) => (
            <article key={log.id} className="v2-glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cyber-border)', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cyber-border)'}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em', marginBottom: '2px' }}>
                    {log.date}
                  </div>
                  <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 800 }}>{log.recipeName}</h4>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                     <span>{log.stats.coffee}g in</span>
                     <span style={{ color: 'var(--text-tertiary)' }}>/</span>
                     <span>{log.stats.water.toFixed(0)}g out</span>
                     <span style={{ color: 'var(--text-tertiary)' }}>/</span>
                     <span>{log.stats.time}</span>
                  </div>
                  
                  <div style={{ width: '40px', textAlign: 'right' }}>
                    {log.score > 0 ? (
                      <span style={{ color: 'var(--cyber-teal)', fontWeight: 800 }}>{log.score.toFixed(1)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '10px', fontWeight: 700 }}>--</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
