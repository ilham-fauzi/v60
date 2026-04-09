import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

const DEFAULT_RECIPES = [
  {
    name: 'V60 Classic (1:15)',
    method: 'v60',
    coffeeGrams: 15,
    waterGrams: 225,
    ratio: 15,
    grindSize: 'medium_fine',
    temperature: 93,
    beanOrigin: 'General Purpose',
    aiGenerated: false,
    stages: [
      { name: 'Bloom', targetWeight: 30, targetSeconds: 45, temperature: 93, notes: 'Saturate all grounds gently' },
      { name: 'Pour 1', targetWeight: 60, targetSeconds: 30, temperature: 93, notes: 'Slow spiral pour' },
      { name: 'Pour 2', targetWeight: 60, targetSeconds: 30, temperature: 93 },
      { name: 'Pour 3', targetWeight: 45, targetSeconds: 25, temperature: 92 },
      { name: 'Pour 4', targetWeight: 30, targetSeconds: 20, temperature: 92 },
      { name: 'Drawdown', targetWeight: 0, targetSeconds: 60, temperature: 0, notes: 'Wait for full drainage' },
    ],
  },
  {
    name: 'V60 Hoffmann Method',
    method: 'v60',
    coffeeGrams: 15,
    waterGrams: 250,
    ratio: 16.7,
    grindSize: 'medium',
    temperature: 100,
    beanOrigin: 'General Purpose',
    aiGenerated: false,
    stages: [
      { name: 'Bloom', targetWeight: 50, targetSeconds: 45, temperature: 100 },
      { name: 'Agitate', targetWeight: 0, targetSeconds: 15, temperature: 0, notes: 'Swirl gently to settle' },
      { name: 'Main Pour', targetWeight: 200, targetSeconds: 30, temperature: 100, notes: 'One continuous pour' },
      { name: 'Drawdown', targetWeight: 0, targetSeconds: 90, temperature: 0 },
    ],
  },
  {
    name: 'AeroPress Inverted',
    method: 'aeropress',
    coffeeGrams: 18,
    waterGrams: 200,
    ratio: 11,
    grindSize: 'medium_fine',
    temperature: 85,
    beanOrigin: 'General Purpose',
    aiGenerated: false,
    stages: [
      { name: 'Bloom', targetWeight: 36, targetSeconds: 30, temperature: 85 },
      { name: 'Fill', targetWeight: 164, targetSeconds: 30, temperature: 85 },
      { name: 'Steep', targetWeight: 0, targetSeconds: 60, temperature: 0, notes: 'Stir and steep' },
      { name: 'Press', targetWeight: 0, targetSeconds: 30, temperature: 0, notes: 'Flip and press slowly' },
    ],
  },
]

async function main() {
  console.log('Seeding recipes...')
  for (const r of DEFAULT_RECIPES) {
    const { stages, ...recipeData } = r
    await prisma.recipe.create({
      data: {
        ...recipeData,
        stages: {
          create: stages,
        },
      },
    })
  }
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
