import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db } from '~/lib/db'

const cookie = 'key'
const year = 60 * 60 * 24 * 365

export function randomToken() {
	return randomBytes(32).toString('base64url')
}

// The cookie holds a session key; the key is checked against the database on every request.
export const currentUser = cache(async () => {
	const key = (await cookies()).get(cookie)?.value
	if (!key) return null
	const session = await db.session.findUnique({ where: { key }, select: { user: true } })
	return session?.user ?? null
})

export async function requireUser(next = '/') {
	const user = await currentUser()
	if (!user) redirect(`/auth/signin?next=${encodeURIComponent(next)}`)
	return user
}

export async function startSession(userId: string) {
	const key = randomToken()
	await db.session.create({ data: { key, userId } })
	;(await cookies()).set(cookie, key, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: year,
		path: '/'
	})
}

export async function endSession() {
	const store = await cookies()
	const key = store.get(cookie)?.value
	if (key) await db.session.deleteMany({ where: { key } })
	store.delete(cookie)
	store.delete('user')
}
