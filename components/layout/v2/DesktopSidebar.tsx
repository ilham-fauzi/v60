'use client'

import React from 'react'
import { Coffee, Library, History, Settings, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBrewStore } from '@/stores/BrewStore'
import styles from './v2.module.css'

const NAV_ITEMS = [
  { id: 'brew', icon: Coffee, label: 'Brewing', path: '/' },
  { id: 'recipes', icon: Library, label: 'Recipes', path: '#recipes' },
  { id: 'history', icon: History, label: 'History', path: '#history' },
]

export function DesktopSidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) {
  const [mounted, setMounted] = React.useState(false)
  const isCollapsed = useBrewStore(s => s.isSidebarCollapsed)
  const toggleSidebar = useBrewStore(s => s.toggleSidebar)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // If not mounted, use default state (false) to match server
  const collapsed = mounted ? isCollapsed : false

  return (
    <aside className={`${styles.sidebar} v2-glass`}>
      <button className={styles.collapseToggle} onClick={toggleSidebar}>
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand */}
      <div className={styles.sidebarBrand}>
        <div className={styles.brandLogo}>
          <Coffee size={18} color="#000" fill="#000" />
        </div>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.brandText}
          >
            V60
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.navContainer}>
        {!collapsed && (
          <div className={styles.sidebarNavHeader}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>OPERATIONS</span>
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--cyber-amber)' }}>
              {activeTab === 'brew' ? 'REAL-TIME TELEMETRY' : 'SYSTEM ACTIVE'}
            </span>
          </div>
        )}
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button 
                  onClick={() => onTabChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    width: '100%', 
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 4 }}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    style={{
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: collapsed ? '0' : 'var(--space-3)',
                      padding: collapsed ? 'var(--space-3) 0' : 'var(--space-3) var(--space-4)',
                    }}
                  >
                    <Icon size={18} className={isActive ? 'glow-amber' : ''} />
                    {!collapsed && <span className={styles.navItemLabel} style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
                  </motion.div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className={styles.sidebarFooter}>
        <button 
          className="btn btn-ghost" 
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', padding: collapsed ? 'var(--space-3) 0' : undefined }}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} />
          {!collapsed && <span className={styles.footerLabel}>Settings</span>}
        </button>
        
        {!collapsed ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ 
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.02)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <div className="live-dot" style={{ width: 6, height: 6 }} />
            <span>Scale: Connected</span>
          </motion.div>
        ) : (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'center' }}>
            <div className="live-dot" style={{ width: 8, height: 8 }} title="Scale: Connected" />
          </div>
        )}
      </div>
    </aside>
  )
}
