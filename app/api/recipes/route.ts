import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        stages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { stages, ...recipeData } = data

    const recipe = await prisma.recipe.create({
      data: {
        ...recipeData,
        stages: {
          create: stages.map((stage: any) => ({
            name: stage.name,
            targetWeight: stage.targetWeight,
            targetSeconds: stage.targetSeconds,
            temperature: stage.temperature,
            notes: stage.notes,
          })),
        },
      },
      include: {
        stages: true,
      },
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error('Failed to create recipe:', error)
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
  }
}
