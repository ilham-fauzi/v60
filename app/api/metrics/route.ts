/**
 * POST /api/metrics
 * Metrics event collector — Plan 2 scaffold.
 * Silently accepts events, never returns errors to client.
 * Not yet wired to any app flow.
 */

import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'

const VALID_EVENTS = ['user_init', 'recipe_created', 'recipe_shared', 'brew_started'] as const
type MetricEvent = typeof VALID_EVENTS[number]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, anon_id, token_id, local_id, source } = body

    // Validate event type
    if (!VALID_EVENTS.includes(event as MetricEvent)) {
      return NextResponse.json({ ok: false }, { status: 200 }) // silent reject
    }

    await prisma.metric.create({
      data: {
        event,
        anonId: anon_id ?? null,
        tokenId: token_id ?? null,
        localId: local_id ?? null,
        source: source ?? null,
        createdAt: Math.floor(Date.now() / 1000),
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Metrics endpoint must NEVER surface errors to client
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}
