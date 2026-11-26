import { z } from 'zod'

export const env = z
	.object({
		URL: z.url(),
		DATABASE_URL: z.string().min(1),
		RESEND_API_KEY: z.string().min(1)
	})
	.parse(process.env)
