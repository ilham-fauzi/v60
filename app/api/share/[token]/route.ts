/**
 * GET  /api/share/[token] — fetch shared recipe by hashed token (lazy deletion)
 * DELETE /api/share/[token] — delete shared recipe by hashed token
 *
 * [token] here is the HASHED token (SHA256 of nanoId), not the raw nanoId.
 * The raw nanoId never reaches the server — only its hash is stored.
 */

import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const now = Math.floor(Date.now() / 1000)
    const entry = await prisma.sharedRecipe.findUnique({
      where: { tokenId: token },
    })

    // 404 — not found
    if (!entry) {
      return NextResponse.json({ error: 'LINK_NOT_FOUND' }, { status: 404 })
    }

    // 410 Gone — lazy deletion of expired entries
    if (entry.expiresAt < now) {
      await prisma.sharedRecipe.delete({ where: { tokenId: token } }).catch(() => {})
      return NextResponse.json({ error: 'LINK_EXPIRED' }, { status: 410 })
    }

    // 200 — return encrypted blob + share chain (server never decrypts)
    return NextResponse.json({
      data: entry.data,
      share_chain: JSON.parse(entry.shareChain),
      expires_at: entry.expiresAt,
    })
  } catch (err) {
    console.error('[GET /api/share/[token]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    await prisma.sharedRecipe.delete({ where: { tokenId: token } }).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch {
    // Silently succeed even if token doesn't exist (idempotent delete)
    return NextResponse.json({ ok: true })
  }
}
