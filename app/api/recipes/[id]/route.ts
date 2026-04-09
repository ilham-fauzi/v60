import { NextResponse } from 'next/server'
import prisma from '@/services/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    const { stages, ...recipeData } = data

    // For simplicity in SQLite migration, we delete old stages and recreate them
    // This is more robust than trying to sync existing IDs for a local prototype
    await prisma.$transaction([
      prisma.brewStage.deleteMany({ where: { recipeId: id } }),
      prisma.recipe.update({
        where: { id },
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
      }),
    ])

    const updated = await prisma.recipe.findUnique({
      where: { id },
      include: { stages: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update recipe:', error)
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    await prisma.recipe.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete recipe:', error)
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}
