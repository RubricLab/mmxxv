'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { z } from 'zod'
import { Prisma } from '~/generated/prisma/client'
import { latestSeason } from '~/lib/data'
import { db } from '~/lib/db'
import { escapeHtml, sendEmail } from '~/lib/email'
import { env } from '~/lib/env'
import { phaseOf, proposalsPerPlayer, rankProposals, roman } from '~/lib/season'
import { endSession, randomToken, requireUser } from '~/lib/session'

// Failed submissions echo their fields back, so the form keeps what was typed.
export type FormState = { error: string | null; fields: Record<string, string> }
export type SignInState = { error: string | null; sent: string | null; email: string }

function fieldsOf(form: FormData) {
	return Object.fromEntries(
		[...form.entries()].flatMap(([key, value]) => (typeof value === 'string' ? [[key, value]] : []))
	)
}

function failed(form: FormData, error: string): FormState {
	return { error, fields: fieldsOf(form) }
}

const done: FormState = { error: null, fields: {} }

function message(error: z.ZodError) {
	return error.issues[0]?.message ?? 'Something is off.'
}

const localPath = z
	.string()
	.regex(/^\/(?!\/)/)
	.catch('/')

// Sign in

export async function requestSignIn(_: SignInState, form: FormData): Promise<SignInState> {
	const typed = String(form.get('email') ?? '').trim()
	const parsed = z
		.object({ email: z.email('That email doesn’t look right.'), next: localPath })
		.safeParse({ email: typed.toLowerCase(), next: form.get('next') })
	if (!parsed.success) return { error: message(parsed.error), sent: null, email: typed }
	const { email, next } = parsed.data

	const recent = await db.signInToken.count({
		where: { email, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } }
	})
	if (recent >= 5) return { error: 'That’s a lot of links. Try again in an hour.', sent: null, email: typed }

	const token = randomToken()
	await db.signInToken.create({ data: { token, email } })
	const url = new URL('/auth/signin/magiclink', env.URL)
	url.searchParams.set('token', token)
	if (next !== '/') url.searchParams.set('next', next)

	const name = roman((await latestSeason()).year)
	const sent = await sendEmail({
		name,
		to: email,
		subject: `Sign in to ${name}`,
		lines: ['Here is your link to sign in. It works for an hour.'],
		action: { label: 'Sign in', url: url.toString() }
	})
	return sent
		? { error: null, sent: email, email }
		: { error: 'The email didn’t send. Try again in a minute.', sent: null, email: typed }
}

export async function signOut() {
	await endSession()
	redirect('/')
}

// Proposals

const marketInput = z.object({
	title: z
		.string()
		.trim()
		.min(8, 'Make the question a little longer.')
		.max(140, 'Keep the question under 140 characters.'),
	resolutionCriteria: z
		.string()
		.trim()
		.min(10, 'Say exactly what makes it resolve YES.')
		.max(600, 'Keep the criteria under 600 characters.'),
	description: z
		.string()
		.trim()
		.max(1000, 'Keep the context under 1000 characters.')
		.transform(value => value || null)
})

function readMarket(form: FormData) {
	return marketInput.safeParse({
		title: form.get('title') ?? '',
		resolutionCriteria: form.get('resolutionCriteria') ?? '',
		description: form.get('description') ?? ''
	})
}

export async function proposeMarket(_: FormState, form: FormData): Promise<FormState> {
	const user = await requireUser()
	const season = await latestSeason()
	if (phaseOf(season) !== 'proposals') return failed(form, 'Proposals are closed.')

	const parsed = readMarket(form)
	if (!parsed.success) return failed(form, message(parsed.error))

	const count = await db.market.count({ where: { seasonYear: season.year, authorId: user.id } })
	if (count >= proposalsPerPlayer) return failed(form, `You’ve made all ${proposalsPerPlayer} proposals.`)

	const market = await db.market.create({
		data: { ...parsed.data, seasonYear: season.year, authorId: user.id }
	})
	redirect(`/markets/${market.id}`)
}

export async function editMarket(_: FormState, form: FormData): Promise<FormState> {
	const user = await requireUser()
	const id = String(form.get('id'))
	const market = await db.market.findUnique({ where: { id }, select: { authorId: true, season: true } })
	if (!market || market.authorId !== user.id) return failed(form, 'Only the author can edit this.')
	if (phaseOf(market.season) !== 'proposals') return failed(form, 'Proposals are closed.')

	const parsed = readMarket(form)
	if (!parsed.success) return failed(form, message(parsed.error))

	await db.market.update({ where: { id }, data: parsed.data })
	redirect(`/markets/${id}`)
}

export async function deleteMarket(form: FormData) {
	const user = await requireUser()
	const id = String(form.get('id'))
	const market = await db.market.findUnique({ where: { id }, select: { authorId: true, season: true } })
	if (!market) redirect('/')
	const own = market.authorId === user.id && phaseOf(market.season) === 'proposals'
	if (!own && !user.admin) return
	await db.market.delete({ where: { id } })
	redirect(`/${market.season.year}`)
}

export async function vote(marketId: string, value: 1 | -1) {
	const user = await requireUser(`/markets/${marketId}`)
	const market = await db.market.findUnique({
		where: { id: marketId },
		select: { authorId: true, season: true }
	})
	if (!market || market.authorId === user.id || phaseOf(market.season) !== 'proposals') return

	const key = { marketId_userId: { marketId, userId: user.id } }
	const existing = await db.vote.findUnique({ where: key })
	if (existing?.value === value) await db.vote.delete({ where: key })
	else await db.vote.upsert({ where: key, create: { marketId, userId: user.id, value }, update: { value } })
	refresh()
}

// Forecasts

export async function forecast(marketId: string, percent: number) {
	const user = await requireUser(`/markets/${marketId}`)
	const value = z.number().int().min(1).max(99).parse(percent)
	const market = await db.market.findUnique({ where: { id: marketId }, select: { season: true } })
	if (!market || phaseOf(market.season) !== 'forecasting') return

	const siblings = await db.market.findMany({
		where: { seasonYear: market.season.year },
		select: { id: true, createdAt: true, votes: { select: { value: true } } }
	})
	const board = rankProposals(
		siblings.map(sibling => ({ ...sibling, net: sibling.votes.reduce((sum, vote) => sum + vote.value, 0) }))
	).slice(0, market.season.boardSize)
	if (!board.some(sibling => sibling.id === marketId)) return

	await db.forecast.upsert({
		where: { marketId_userId: { marketId, userId: user.id } },
		create: { marketId, userId: user.id, percent: value },
		update: { percent: value }
	})
	refresh()
}

// Resolution, by an admin, once forecasts have locked

export async function resolveMarket(_: FormState, form: FormData): Promise<FormState> {
	const user = await requireUser()
	if (!user.admin) return failed(form, 'Only an admin can resolve markets.')
	const parsed = z
		.object({
			id: z.string(),
			outcome: z.enum(['yes', 'no', 'open']),
			note: z
				.string()
				.trim()
				.max(500)
				.transform(value => value || null)
		})
		.safeParse({ id: form.get('id'), outcome: form.get('outcome'), note: form.get('note') ?? '' })
	if (!parsed.success) return failed(form, message(parsed.error))
	const { id, outcome, note } = parsed.data

	const market = await db.market.findUnique({ where: { id }, select: { season: true } })
	if (!market) return failed(form, 'Market not found.')
	const phase = phaseOf(market.season)
	if (phase !== 'live' && phase !== 'final') return failed(form, 'Markets resolve after forecasts lock.')

	await db.market.update({
		where: { id },
		data:
			outcome === 'open'
				? { outcome: null, resolvedAt: null, resolutionNote: null }
				: { outcome: outcome === 'yes', resolvedAt: new Date(), resolutionNote: note }
	})
	refresh()
	return done
}

// Discussion

export async function addComment(_: FormState, form: FormData): Promise<FormState> {
	const marketId = String(form.get('marketId'))
	const user = await requireUser(`/markets/${marketId}`)
	const parsed = z
		.object({
			content: z.string().trim().min(1, 'Write something first.').max(2000, 'Keep it under 2000 characters.'),
			parentId: z
				.string()
				.transform(value => value || null)
				.nullable()
		})
		.safeParse({ content: form.get('content') ?? '', parentId: form.get('parentId') })
	if (!parsed.success) return failed(form, message(parsed.error))
	const { content, parentId } = parsed.data

	if (parentId) {
		const parent = await db.comment.findUnique({ where: { id: parentId }, select: { marketId: true } })
		if (parent?.marketId !== marketId) return failed(form, 'That comment is gone.')
	}

	const comment = await db.comment.create({ data: { marketId, authorId: user.id, parentId, content } })
	after(() => notify(comment.id))
	refresh()
	return done
}

export async function deleteComment(form: FormData) {
	const user = await requireUser()
	const id = String(form.get('id'))
	const comment = await db.comment.findUnique({ where: { id }, select: { authorId: true } })
	if (!comment || (comment.authorId !== user.id && !user.admin)) return
	await db.comment.delete({ where: { id } })
	refresh()
}

async function notify(commentId: string) {
	const contact = { select: { id: true, email: true, username: true } } as const
	const comment = await db.comment.findUnique({
		where: { id: commentId },
		select: {
			content: true,
			author: contact,
			parent: { select: { author: contact } },
			market: { select: { id: true, title: true, seasonYear: true, author: contact } }
		}
	})
	if (!comment) return

	const mentioned = [...comment.content.matchAll(/@([a-zA-Z0-9_]{2,20})/g)].flatMap(match => match[1] ?? [])
	const mentions = mentioned.length
		? await db.user.findMany({ where: { username: { in: mentioned } }, ...contact })
		: []

	const recipients = new Map<string, { email: string; reason: string }>()
	recipients.set(comment.market.author.id, { email: comment.market.author.email, reason: 'commented on' })
	if (comment.parent)
		recipients.set(comment.parent.author.id, {
			email: comment.parent.author.email,
			reason: 'replied to you on'
		})
	for (const user of mentions) recipients.set(user.id, { email: user.email, reason: 'mentioned you on' })
	recipients.delete(comment.author.id)

	const name = roman(comment.market.seasonYear)
	const excerpt = comment.content.replace(/@\[[^:\]]+:([^\]]+)\]/g, '@$1').slice(0, 400)
	await Promise.all(
		[...recipients.values()].map(({ email, reason }) =>
			sendEmail({
				name,
				to: email,
				subject: `${comment.author.username} ${reason} “${comment.market.title}”`,
				lines: [
					`<b>${escapeHtml(comment.author.username)}</b> ${reason} <i>${escapeHtml(comment.market.title)}</i>`,
					`<span style="color:#4a463f">${escapeHtml(excerpt)}</span>`
				],
				action: { label: 'Open the market', url: `${env.URL}/markets/${comment.market.id}` }
			})
		)
	)
}

// Profile

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
	const user = await requireUser('/account')
	const parsed = z
		.object({
			username: z
				.string()
				.trim()
				.regex(/^[a-zA-Z0-9_]{2,20}$/, 'Use 2 to 20 letters, numbers or underscores.'),
			bio: z
				.string()
				.trim()
				.max(160, 'Keep your bio under 160 characters.')
				.transform(value => value || null)
		})
		.safeParse({ username: form.get('username') ?? '', bio: form.get('bio') ?? '' })
	if (!parsed.success) return failed(form, message(parsed.error))

	try {
		await db.user.update({ where: { id: user.id }, data: parsed.data })
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
			return failed(form, 'That username is taken.')
		throw error
	}
	refresh()
	return done
}
