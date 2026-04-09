'use client'

import styles from './ScalePanel.module.css'
import { useState, useCallback } from 'react'
import { ScaleService } from '@/services/ScaleService'
import { useBrewStore } from '@/stores/BrewStore'
import type { ScaleType } from '@/types'

const SCALE_OPTIONS: { value: ScaleType; label: string; protocol: string; supported: boolean }[] = [
  { value: 'acaia_pearl', label: 'Acaia Pearl', protocol: 'BLE Custom', supported: true },
  { value: 'acaia_lunar', label: 'Acaia Lunar', protocol: 'BLE Custom', supported: true },
  { value: 'timemore', label: 'Timemore Black Mirror 2', protocol: 'BLE Custom', supported: true },
  { value: 'felicita', label: 'Felicita Arc', protocol: 'BLE Custom', supported: false },
  { value: 'mock', label: '⚗ Virtual Scale (Demo)', protocol: 'Simulator', supported: true },
]

const scaleServiceRef: { current: ScaleService | null } = { current: null }

export function ScalePanel() {
  const { scaleConnection, setScaleConnection, onWeightUpdate, tare } = useBrewStore()
  const [selectedType, setSelectedType] = useState<ScaleType>('mock')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isConnected = scaleConnection.connected

  const handleConnect = useCallback(async () => {
    setError(null)
    setIsConnecting(true)

    try {
      // Disconnect existing
      if (scaleServiceRef.current) {
        await scaleServiceRef.current.disconnect()
      }

      scaleServiceRef.current = new ScaleService()

      await scaleServiceRef.current.connect(
        selectedType,
        (weight) => {
          onWeightUpdate(weight)
        },
        (err) => {
          setError(err.message)
          setScaleConnection({ type: null, connected: false, lastError: err.message })
        }
      )

      setScaleConnection({ type: selectedType, connected: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      setError(msg)
      setScaleConnection({ type: null, connected: false, lastError: msg })
    } finally {
      setIsConnecting(false)
    }
  }, [selectedType, onWeightUpdate, setScaleConnection])

  const handleDisconnect = useCallback(async () => {
    if (scaleServiceRef.current) {
      await scaleServiceRef.current.disconnect()
      scaleServiceRef.current = null
    }
    setScaleConnection({ type: null, connected: false })
    setError(null)
  }, [setScaleConnection])

  const handleTare = useCallback(async () => {
    tare()
    if (scaleServiceRef.current) {
      await scaleServiceRef.current.tare()
    }
  }, [tare])

  const isBluetooth = selectedType !== 'mock'

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>
          <span>⚖️</span> Scale Connection
        </h3>
        {isConnected && (
          <div className="badge badge-connected">
            <div className="live-dot" style={{ width: 6, height: 6 }} />
            Connected
          </div>
        )}
      </div>

      {/* Scale selection */}
      {!isConnected && (
        <div className={styles.selectRow}>
          <select
            id="scale-type-select"
            className={`input select ${styles.scaleSelect}`}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ScaleType)}
            disabled={isConnecting}
          >
            {SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={!opt.supported}>
                {opt.label} {!opt.supported ? '(coming soon)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Connected state */}
      {isConnected && (
        <div className={styles.connectedInfo}>
          <div className={styles.scaleName}>
            {SCALE_OPTIONS.find((o) => o.value === scaleConnection.type)?.label}
          </div>
          <div className={styles.scaleProto}>
            {SCALE_OPTIONS.find((o) => o.value === scaleConnection.type)?.protocol}
          </div>
        </div>
      )}

      {/* Bluetooth warning */}
      {isBluetooth && !isConnected && (
        <div className={styles.btWarning}>
          <span>🔵</span>
          <p>Requires Chromium browser (Chrome, Edge). Close the scale's official app before connecting.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.errorMsg}>
          <span>⚠</span>
          <p>{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className={styles.actions}>
        {!isConnected ? (
          <button
            id="connect-scale-btn"
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <><span className="animate-spin">↻</span> Connecting...</>
            ) : (
              <><span>🔗</span> Connect Scale</>
            )}
          </button>
        ) : (
          <>
            <button id="tare-scale-btn" className="btn btn-secondary" onClick={handleTare}>
              ⊙ Tare
            </button>
            <button id="disconnect-scale-btn" className="btn btn-ghost" onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  )
}
