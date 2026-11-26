import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '~/generated/prisma/client'
import { env } from '~/lib/env'

declare global {
	var prisma: PrismaClient | undefined
}

export const db =
	globalThis.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
