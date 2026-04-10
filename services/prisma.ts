import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // Use a proxy or a lazy-initialized client to handle the async adapter setup
  // However, for typical D1 usage on Cloudflare, we can access the binding directly.
  
  // @ts-ignore - DB is the Cloudflare D1 binding name from wrangler.json
  const d1 = (globalThis as any).DB || (globalThis as any).process?.env?.DB

  if (d1) {
    // Cloudflare D1 Path
    const { PrismaD1 } = require('@prisma/adapter-d1')
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter })
  }

  // Fallback to Local SQLite for Dev/VPS
  try {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
    const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
    const adapter = new PrismaBetterSqlite3({ url: dbUrl })
    return new PrismaClient({ adapter })
  } catch (e) {
    // If we're in a environment where better-sqlite3 isn't available (like build time for Edge)
    return new PrismaClient()
  }
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
