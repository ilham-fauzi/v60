'use client'

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
  const isCollapsed = useBrewStore(s => s.isSidebarCollapsed)
  const toggleSidebar = useBrewStore(s => s.toggleSidebar)

  return (
    <aside className={`${styles.sidebar} v2-glass`}>
      <button className={styles.collapseToggle} onClick={toggleSidebar}>
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand */}
      <div className={styles.sidebarBrand}>
        <div className={styles.brandLogo}>
          <Coffee size={18} color="#000" fill="#000" />
        </div>
        {!isCollapsed && (
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
        {!isCollapsed && <div className={`${styles.sidebarNavHeader} cyber-panel-header`}>Navigation</div>}
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button 
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
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
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      gap: isCollapsed ? '0' : 'var(--space-3)',
                      padding: isCollapsed ? 'var(--space-3) 0' : 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--cyber-amber)' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(255, 191, 0, 0.08)' : 'transparent',
                      transition: 'all var(--transition-base)',
                      border: isActive ? '1px solid rgba(255, 191, 0, 0.2)' : '1px solid transparent',
                    }}
                  >
                    <Icon size={18} className={isActive ? 'glow-amber' : ''} />
                    {!isCollapsed && <span className={styles.navItemLabel}>{item.label}</span>}
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
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', width: '100%', padding: isCollapsed ? 'var(--space-3) 0' : undefined }}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={18} />
          {!isCollapsed && <span className={styles.footerLabel}>Settings</span>}
        </button>
        
        {!isCollapsed ? (
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
