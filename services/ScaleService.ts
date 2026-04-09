/**
 * BrewMaster AI - Scale Service
 * Handles Web Bluetooth API connections for Acaia, Timemore, and Mock scales.
 * Low-latency streaming using BLE notifications.
 */

import type { ScaleType } from '@/types'

// ---- Acaia Protocol Constants (reverse-engineered from btscale / open-source) ----
const ACAIA_SERVICE_UUID = '00001820-0000-1000-8000-00805f9b34fb'
const ACAIA_CHAR_UUID = '00002a80-0000-1000-8000-00805f9b34fb'
const ACAIA_HEADER = [0xef, 0xdd]

// ---- Timemore Protocol ----
const TIMEMORE_SERVICE_UUID = '00001000-0000-1000-8000-00805f9b34fb'
const TIMEMORE_CHAR_UUID = '00001001-0000-1000-8000-00805f9b34fb'

// ---- Scale BLE Device Name Filters ----
export const SCALE_FILTERS: Record<Exclude<ScaleType, 'mock'>, BluetoothLEScanFilter[]> = {
  acaia_pearl: [{ namePrefix: 'ACAIA' }, { namePrefix: 'PEARL' }],
  acaia_lunar: [{ namePrefix: 'ACAIA' }, { namePrefix: 'LUNAR' }],
  timemore: [{ namePrefix: 'Timemore' }, { namePrefix: 'TIMEMORE_G' }],
  felicita: [{ namePrefix: 'felicita' }, { namePrefix: 'FELICITA' }],
}

type WeightCallback = (weight: number) => void
type ErrorCallback = (error: Error) => void

// ---- Parse Acaia BLE data packet ----
function parseAcaiaPacket(data: DataView): number | null {
  const bytes: number[] = []
  for (let i = 0; i < data.byteLength; i++) bytes.push(data.getUint8(i))

  // Validate header
  if (bytes[0] !== ACAIA_HEADER[0] || bytes[1] !== ACAIA_HEADER[1]) return null

  // Byte 3 is message type, 0x07 or 0x08 indicates weight
  const msgType = bytes[2]
  if (msgType !== 0x07 && msgType !== 0x08) return null

  // Weight is encoded in bytes 5-6 as a fixed-point integer (unit: 0.1g)
  if (bytes.length < 7) return null
  const weight = ((bytes[6] << 8) | bytes[5]) / 10.0
  const negative = (bytes[7] & 0x02) !== 0
  return negative ? -weight : weight
}

// ---- Parse Timemore BLE data packet ----
function parseTimemorePacket(data: DataView): number | null {
  const bytes: number[] = []
  for (let i = 0; i < data.byteLength; i++) bytes.push(data.getUint8(i))
  if (bytes.length < 6) return null
  // Timemore: bytes 3-4 are weight in 0.1g units
  const raw = (bytes[3] << 8) | bytes[4]
  return raw / 10.0
}

// ---- Mock Scale (simulates pouring) ----
class MockScale {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private currentWeight = 0
  private isPouring = false

  start(onWeight: WeightCallback) {
    // Toggle between pouring and resting phases
    let tick = 0
    this.intervalId = setInterval(() => {
      tick++
      // Pour for 3 seconds, rest for 1 second
      this.isPouring = tick % 40 < 30
      if (this.isPouring) {
        this.currentWeight += 0.5 + Math.random() * 0.8
      } else {
        // slight drip
        this.currentWeight += 0.05 * Math.random()
      }
      this.currentWeight = Math.min(this.currentWeight, 300)
      onWeight(parseFloat(this.currentWeight.toFixed(1)))
    }, 100) // 10 Hz
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  reset() {
    this.currentWeight = 0
    this.isPouring = false
  }
}

// ---- Main ScaleService ----
export class ScaleService {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private mockScale: MockScale | null = null
  private scaleType: ScaleType | null = null
  private onWeightCallback: WeightCallback | null = null
  private onErrorCallback: ErrorCallback | null = null

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  isMockSupported(type: ScaleType): boolean {
    return type === 'mock'
  }

  async connect(type: ScaleType, onWeight: WeightCallback, onError: ErrorCallback): Promise<void> {
    this.onWeightCallback = onWeight
    this.onErrorCallback = onError
    this.scaleType = type

    if (type === 'mock') {
      this.mockScale = new MockScale()
      this.mockScale.start(onWeight)
      return
    }

    if (!this.isSupported()) {
      throw new Error('Web Bluetooth API is not supported in this browser. Please use Chrome or Edge.')
    }

    const filters = SCALE_FILTERS[type as Exclude<ScaleType, 'mock'>] || []

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters,
        optionalServices: [
          ACAIA_SERVICE_UUID,
          TIMEMORE_SERVICE_UUID,
          'battery_service',
        ],
      })

      this.device.addEventListener('gattserverdisconnected', () => {
        onError(new Error('Scale disconnected unexpectedly'))
        this.cleanup()
      })

      const server = await this.device.gatt!.connect()

      if (type === 'acaia_pearl' || type === 'acaia_lunar') {
        await this.setupAcaia(server, onWeight)
      } else if (type === 'timemore') {
        await this.setupTimemore(server, onWeight)
      }
    } catch (err) {
      this.cleanup()
      throw err
    }
  }

  private async setupAcaia(server: BluetoothRemoteGATTServer, onWeight: WeightCallback) {
    const service = await server.getPrimaryService(ACAIA_SERVICE_UUID)
    this.characteristic = await service.getCharacteristic(ACAIA_CHAR_UUID)
    await this.characteristic.startNotifications()

    // Send init commands to Acaia (heartbeat/ident)
    const initCmd = new Uint8Array([...ACAIA_HEADER, 0x0b, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00])
    await this.characteristic.writeValue(initCmd)

    this.characteristic.addEventListener('characteristicvaluechanged', (e) => {
      const target = e.target as BluetoothRemoteGATTCharacteristic
      if (!target.value) return
      const weight = parseAcaiaPacket(target.value)
      if (weight !== null) onWeight(weight)
    })
  }

  private async setupTimemore(server: BluetoothRemoteGATTServer, onWeight: WeightCallback) {
    const service = await server.getPrimaryService(TIMEMORE_SERVICE_UUID)
    this.characteristic = await service.getCharacteristic(TIMEMORE_CHAR_UUID)
    await this.characteristic.startNotifications()

    this.characteristic.addEventListener('characteristicvaluechanged', (e) => {
      const target = e.target as BluetoothRemoteGATTCharacteristic
      if (!target.value) return
      const weight = parseTimemorePacket(target.value)
      if (weight !== null) onWeight(weight)
    })
  }

  async tare(): Promise<void> {
    if (this.scaleType === 'mock') {
      this.mockScale?.reset()
      return
    }
    if (!this.characteristic) return

    // Acaia tare command
    if (this.scaleType === 'acaia_pearl' || this.scaleType === 'acaia_lunar') {
      const tareCmd = new Uint8Array([...ACAIA_HEADER, 0x0c, 0x00])
      await this.characteristic.writeValue(tareCmd)
    }
  }

  async disconnect(): Promise<void> {
    this.cleanup()
  }

  private cleanup() {
    if (this.mockScale) {
      this.mockScale.stop()
      this.mockScale = null
    }
    if (this.characteristic) {
      this.characteristic.stopNotifications().catch(() => {})
      this.characteristic = null
    }
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }
    this.device = null
    this.scaleType = null
    this.onWeightCallback = null
    this.onErrorCallback = null
  }
}

export default ScaleService
