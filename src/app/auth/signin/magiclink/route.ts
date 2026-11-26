import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { db } from '~/lib/db'
import { startSession } from '~/lib/session'

const hour = 60 * 60 * 1000

async function usernameFor(email: string) {
	const base = (email.split('@')[0] ?? '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16) || 'player'
	for (let suffix = 0; ; suffix++) {
		const candidate = suffix === 0 ? base : `${base}${suffix}`
		if (!(await db.user.findUnique({ where: { username: candidate }, select: { id: true } })))
			return candidate
	}
}

// Links stay valid for an hour and can be opened more than once, so mail scanners can't burn them.
export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get('token') ?? ''
	const next = request.nextUrl.searchParams.get('next') ?? '/'
	const signIn = token ? await db.signInToken.findUnique({ where: { token } }) : null
	if (!signIn || Date.now() - signIn.createdAt.getTime() > hour) redirect('/auth/signin?expired=1')

	const user =
		(await db.user.findUnique({ where: { email: signIn.email }, select: { id: true } })) ??
		(await db.user.create({
			data: { email: signIn.email, username: await usernameFor(signIn.email) },
			select: { id: true }
		}))

	await startSession(user.id)
	redirect(/^\/(?!\/)/.test(next) ? next : '/')
}
