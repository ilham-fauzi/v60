'use client'

import styles from './NavBar.module.css'
import { useBrewStore } from '@/stores/BrewStore'

interface NavBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const TABS = [
  { id: 'brew', label: 'Brew', icon: '☕' },
  { id: 'recipes', label: 'Recipes', icon: '📋' },
  { id: 'ai', label: 'AI Engine', icon: '✨' },
  { id: 'journal', label: 'Dial-In', icon: '🔬' },
]

export function NavBar({ activeTab, onTabChange }: NavBarProps) {
  const { isBrewing, isFocusMode, toggleFocusMode, scaleConnection } = useBrewStore()

  return (
    <header className={`${styles.header} ${isFocusMode ? styles.hidden : ''}`}>
      <div className={styles.inner}>
        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.logo}>☕</span>
          <div className={styles.brandText}>
            <span className={styles.brandName}>BrewMaster</span>
            <span className={styles.brandAI}>AI</span>
          </div>
        </div>

        {/* Tabs */}
        <nav className={styles.nav} role="navigation" aria-label="Main navigation">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              className={`${styles.navBtn} ${activeTab === tab.id ? styles.navBtnActive : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className={styles.rightSection}>
          {/* Brew indicator */}
          {isBrewing && (
            <div className={`${styles.brewingPill} animate-pulse-ring`}>
              <div className="live-dot" />
              <span>Brewing</span>
            </div>
          )}

          {/* Scale status */}
          <div className={`${styles.scaleStatus} ${scaleConnection.connected ? styles.connected : ''}`}>
            <span>{scaleConnection.connected ? '⚖️' : '⚖'}</span>
            <span className={styles.scaleLabel}>
              {scaleConnection.connected ? 'Scale' : 'No Scale'}
            </span>
          </div>

          {/* Focus Mode Toggle */}
          <button
            id="focus-mode-btn"
            className={`btn btn-icon btn-ghost ${isFocusMode ? styles.focusActive : ''}`}
            onClick={toggleFocusMode}
            title="Focus Mode — hides navigation during brew"
          >
            {isFocusMode ? '⊠' : '⊡'}
          </button>
        </div>
      </div>

      {/* Focus Mode Banner */}
      {isBrewing && (
        <div className={styles.focusHint}>
          Press <kbd>F</kbd> for Focus Mode during brew
        </div>
      )}
    </header>
  )
}
