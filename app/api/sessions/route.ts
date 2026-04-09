import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'

export async function GET() {
  try {
    const sessions = await prisma.brewSession.findMany({
      orderBy: {
        startedAt: 'desc',
      },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { history, sensoryFeedback, recipeId, ...sessionData } = data

    const session = await prisma.brewSession.create({
      data: {
        ...sessionData,
        recipeId: recipeId !== 'manual' ? recipeId : null,
        historyJson: JSON.stringify(history),
        sensoryFeedback: sensoryFeedback ? JSON.stringify(sensoryFeedback) : null,
      },
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Failed to save session:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}
