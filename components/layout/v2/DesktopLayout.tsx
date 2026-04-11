import React from 'react'
import { DesktopSidebar } from './DesktopSidebar'
import { TopMenuBar } from './TopMenuBar'
import { useBrewStore } from '@/stores/BrewStore'
import { Minimize2 } from 'lucide-react'
import styles from './v2.module.css'

interface DesktopLayoutProps {
  children: React.ReactNode
  rightContent?: React.ReactNode
  activeTab: string
  onTabChange: (id: string) => void
  isFocusMode?: boolean
}

export function DesktopLayout({ 
  children, 
  rightContent, 
  activeTab, 
  onTabChange, 
  isFocusMode = false 
}: DesktopLayoutProps) {
  const isSidebarCollapsed = useBrewStore(s => s.isSidebarCollapsed)
  const toggleFocusMode = useBrewStore(s => s.toggleFocusMode)

  return (
    <div className={`
      ${styles.layoutContainer} 
      ${isFocusMode ? styles.focusMode : ''} 
      ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}
      mesh-gradient
    `}>
      <DesktopSidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {isFocusMode && (
        <button className={styles.exitFocusBtn} onClick={toggleFocusMode}>
          <Minimize2 size={14} /> Exit Focus [F]
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopMenuBar activeTab={activeTab} />
        
        <main className={styles.mainContent} style={{ overflowY: 'auto' }}>
          {/* Workspace Area */}
          <div style={{ minWidth: 0 }}>
            {children}
          </div>

          {/* Intelligence Side Panel */}
          {rightContent && (
            <aside className={styles.intelligencePanel}>
              {rightContent}
            </aside>
          )}
        </main>
      </div>
    </div>
  )
}
