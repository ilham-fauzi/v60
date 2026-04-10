import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Check if we are in the Cloudflare Workers / Edge environment
  const isEdge = process.env.NEXT_RUNTIME === 'edge'

  // @ts-ignore - DB is the Cloudflare D1 binding name
  const d1 = (globalThis as any).DB

  if (isEdge && d1) {
    // Cloudflare D1 Path
    // Using simple dynamic require that modern bundlers can prune
    const { PrismaD1 } = require('@prisma/adapter-d1')
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter })
  }

  // Local/Dev Path - We use better-sqlite3 ONLY when not in Edge
  if (!isEdge) {
    try {
      const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
      const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
      const adapter = new PrismaBetterSqlite3({ url: dbUrl })
      return new PrismaClient({ adapter })
    } catch (e) {
      // Fallback for environment where binaries aren't available
      return new PrismaClient()
    }
  }

  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
