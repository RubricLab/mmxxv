import { existsSync } from 'node:fs'
import { defineConfig, env } from 'prisma/config'

if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
	schema: 'prisma/schema.prisma',
	datasource: { url: env('DATABASE_URL') }
})
