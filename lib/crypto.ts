/**
 * BrewForce Crypto Utilities
 * Client-side AES-GCM encryption using Web Crypto API.
 * Server never sees plaintext — zero-knowledge design.
 */

const SALT = new TextEncoder().encode('brewforce-v1')
const PBKDF2_ITERATIONS = 100_000

/**
 * Derive a 256-bit AES-GCM key from a string secret (nanoId or anonId).
 */
async function deriveKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt a JSON-serializable object using the given secret.
 * Returns a base64 string containing IV + ciphertext.
 */
export async function encrypt(data: object, secret: string): Promise<string> {
  const key = await deriveKey(secret)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(data))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  // Prefix IV (12 bytes) to the ciphertext before base64 encoding
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), 12)
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a base64 string (IV + ciphertext) using the given secret.
 * Returns the original object, or null if decryption fails.
 */
export async function decrypt<T = object>(ciphertext: string, secret: string): Promise<T | null> {
  try {
    const key = await deriveKey(secret)
    const bytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
    const iv = bytes.slice(0, 12)
    const data = bytes.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(decrypted)) as T
  } catch {
    return null
  }
}

/**
 * SHA-256 hash a string. Used to hash nanoId before storing in DB
 * so the raw token is never persisted — only the hash.
 * Works in both browser (SubtleCrypto) and Node.js (via crypto global).
 */
export async function hashToken(nanoId: string): Promise<string> {
  // Browser / Edge runtime path
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(nanoId)
    )
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // Node.js path (server-side API routes)
  const { createHash } = await import('crypto')
  return createHash('sha256').update(nanoId).digest('hex')
}
