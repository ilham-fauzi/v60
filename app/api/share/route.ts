/**
 * POST /api/share
 * Create a new shared recipe entry in SQLite.
 * Receives pre-encrypted data from the client — server never sees plaintext.
 */

import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token_id, data, share_chain, created_at, expires_at } = body

    if (!token_id || !data || !created_at || !expires_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await prisma.sharedRecipe.create({
      data: {
        tokenId: token_id,
        data,
        shareChain: JSON.stringify(share_chain ?? []),
        createdAt: created_at,
        expiresAt: expires_at,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/share]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
