'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, User } from 'lucide-react'
import { useBrewStore } from '@/stores/BrewStore'
import styles from './v2.module.css'

interface TopMenuBarProps {
  activeTab: string
}

export function TopMenuBar({ activeTab }: TopMenuBarProps) {
  const { activeRecipe } = useBrewStore()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Determine dynamic string based on the active tab
  let subtitle = 'SYSTEM ACTIVE'
  let rightMenu = null

  if (activeTab === 'recipes') {
    subtitle = 'DIGITAL LIBRARY'
    rightMenu = null
  } else if (activeTab === 'history') {
    subtitle = 'ACTIVE SESSION   JOURNAL   INVENTORY'
    rightMenu = (
      <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>
        <span style={{ cursor: 'pointer' }}>ACTIVE SESSION</span>
        <span style={{ color: 'var(--cyber-amber)', cursor: 'pointer' }}>JOURNAL</span>
        <span style={{ cursor: 'pointer' }}>INVENTORY</span>
      </div>
    )
  }

  return (
    <header className={`${styles.topMenuBar} v2-glass`} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      padding: '0 var(--space-6)',
      borderBottom: '1px solid var(--cyber-border)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(10, 10, 11, 0.8)'
    }}>
      {/* Left section: Logo text + Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ 
          color: 'var(--cyber-amber)', 
          fontWeight: 800, 
          letterSpacing: '0.05em',
          fontSize: 'var(--text-sm)'
        }}>
          V60 BREWMASTER
        </div>
        
        <div style={{ color: 'var(--cyber-border)', fontSize: 'var(--text-lg)' }}>|</div>
        
        {/* Subtitle */}
        {activeTab !== 'history' ? (
          <div style={{ 
            color: 'var(--cyber-amber)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: '0.1em'
          }}>
            {subtitle}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginLeft: 'var(--space-2)' }}>
             {/* When in History mode, the right menu takes over these links */}
          </div>
        )}
      </div>

      {/* Right section: Context Menu + System indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        {activeTab === 'history' && rightMenu}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {/* Temperature Indicator */}
          {isMounted && activeRecipe && activeRecipe.temperature > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-2)',
              background: 'var(--bg-card)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--cyber-border)'
            }}>
              <span style={{ color: 'var(--cyber-amber)', fontSize: '10px' }}>🌡</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{activeRecipe.temperature}°C</span>
            </div>
          )}
          
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Settings size={18} />
          </button>
          <button style={{ background: 'var(--bg-card)', border: '1px solid var(--cyber-border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <User size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
