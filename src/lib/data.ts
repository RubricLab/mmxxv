import type { User } from '~/generated/prisma/client'
import { db } from '~/lib/db'
import { median, points } from '~/lib/score'
import { isSealed, phaseOf, rankProposals } from '~/lib/season'

type Person = { id: string; username: string }

export type Row = {
	id: string
	title: string
	author: Person
	comments: number
	rank: number
	net: number
	myVote: number
	onBoard: boolean
	forecasts: number
	myForecast: number | null
	crowd: number | null
	outcome: boolean | null
	myPoints: number | null
}

export type Standing = { user: Person; points: number; forecasts: number; scored: number }

export type CommentNode = {
	id: string
	content: string
	createdAt: Date
	author: Person
	replies: CommentNode[]
}

const person = { select: { id: true, username: true } } as const

export async function latestSeason() {
	return db.season.findFirstOrThrow({ orderBy: { year: 'desc' } })
}

export async function seasonYears() {
	const seasons = await db.season.findMany({ select: { year: true }, orderBy: { year: 'asc' } })
	return seasons.map(season => season.year)
}

function standingsOf(markets: { outcome: boolean | null; forecasts: { percent: number; user: Person }[] }[]) {
	const table = new Map<string, Standing>()
	for (const market of markets) {
		for (const forecast of market.forecasts) {
			const standing = table.get(forecast.user.id) ?? {
				user: forecast.user,
				points: 0,
				forecasts: 0,
				scored: 0
			}
			standing.forecasts += 1
			if (market.outcome !== null) {
				standing.points += points(forecast.percent, market.outcome)
				standing.scored += 1
			}
			table.set(forecast.user.id, standing)
		}
	}
	return [...table.values()].sort(
		(a, b) =>
			b.points - a.points || b.forecasts - a.forecasts || a.user.username.localeCompare(b.user.username)
	)
}

export async function loadSeason(year: number, viewer: User | null) {
	const season = await db.season.findUnique({ where: { year } })
	if (!season) return null
	const phase = phaseOf(season)
	const sealed = isSealed(phase)

	const markets = await db.market.findMany({
		where: { seasonYear: year },
		select: {
			id: true,
			title: true,
			createdAt: true,
			outcome: true,
			author: person,
			votes: { select: { userId: true, value: true } },
			forecasts: { select: { percent: true, user: person } },
			_count: { select: { comments: true } }
		}
	})

	const ranked = rankProposals(
		markets.map(market => ({ ...market, net: market.votes.reduce((sum, vote) => sum + vote.value, 0) }))
	)
	const board = ranked.slice(0, season.boardSize)

	const rows: Row[] = ranked.map((market, index) => {
		const mine = viewer ? market.forecasts.find(forecast => forecast.user.id === viewer.id) : undefined
		return {
			id: market.id,
			title: market.title,
			author: market.author,
			comments: market._count.comments,
			rank: index + 1,
			net: market.net,
			myVote: market.votes.find(vote => vote.userId === viewer?.id)?.value ?? 0,
			onBoard: index < season.boardSize,
			forecasts: market.forecasts.length,
			myForecast: mine?.percent ?? null,
			crowd: sealed ? null : median(market.forecasts.map(forecast => forecast.percent)),
			outcome: market.outcome,
			myPoints: mine && market.outcome !== null ? points(mine.percent, market.outcome) : null
		}
	})

	const standings = standingsOf(board)
	return {
		season,
		phase,
		rows,
		board: rows.filter(row => row.onBoard),
		players: standings.length,
		standings: sealed ? [] : standings,
		resolved: board.filter(market => market.outcome !== null).length
	}
}

function thread(comments: Omit<CommentNode, 'replies'>[], parents: Map<string, string | null>) {
	const nodes = new Map<string, CommentNode>(
		comments.map(comment => [comment.id, { ...comment, replies: [] }])
	)
	const roots: CommentNode[] = []
	for (const node of nodes.values()) {
		const parentId = parents.get(node.id)
		const parent = parentId ? nodes.get(parentId) : undefined
		if (parent) parent.replies.push(node)
		else roots.push(node)
	}
	return roots
}

export async function loadMarket(id: string, viewer: User | null) {
	const market = await db.market.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			description: true,
			resolutionCriteria: true,
			outcome: true,
			resolutionNote: true,
			resolvedAt: true,
			createdAt: true,
			season: true,
			author: person,
			votes: { select: { userId: true, value: true } },
			forecasts: { select: { percent: true, user: person } },
			comments: {
				orderBy: { createdAt: 'asc' },
				select: { id: true, content: true, createdAt: true, parentId: true, author: person }
			}
		}
	})
	if (!market) return null

	const phase = phaseOf(market.season)
	const sealed = isSealed(phase)
	const siblings = await db.market.findMany({
		where: { seasonYear: market.season.year },
		select: { id: true, createdAt: true, votes: { select: { value: true } } }
	})
	const ranked = rankProposals(
		siblings.map(sibling => ({ ...sibling, net: sibling.votes.reduce((sum, vote) => sum + vote.value, 0) }))
	)
	const rank = ranked.findIndex(sibling => sibling.id === id) + 1
	const outcome = market.outcome

	const forecasts = market.forecasts
		.map(forecast => ({
			user: forecast.user,
			percent: forecast.percent,
			points: outcome === null ? null : points(forecast.percent, outcome)
		}))
		.sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || b.percent - a.percent)

	return {
		market,
		phase,
		rank,
		total: ranked.length,
		onBoard: rank <= market.season.boardSize,
		net: market.votes.reduce((sum, vote) => sum + vote.value, 0),
		myVote: market.votes.find(vote => vote.userId === viewer?.id)?.value ?? 0,
		myForecast: market.forecasts.find(forecast => forecast.user.id === viewer?.id)?.percent ?? null,
		forecastCount: forecasts.length,
		forecasts: sealed ? [] : forecasts,
		crowd: sealed ? null : median(forecasts.map(forecast => forecast.percent)),
		comments: thread(
			market.comments.map(({ parentId: _, ...comment }) => comment),
			new Map(market.comments.map(comment => [comment.id, comment.parentId]))
		)
	}
}

export async function loadUser(id: string, viewer: User | null) {
	const user = await db.user.findUnique({
		where: { id },
		select: {
			id: true,
			username: true,
			bio: true,
			createdAt: true,
			markets: {
				orderBy: { createdAt: 'desc' },
				select: { id: true, title: true, seasonYear: true, outcome: true, votes: { select: { value: true } } }
			},
			forecasts: {
				select: { percent: true, market: { select: { id: true, title: true, outcome: true, season: true } } }
			}
		}
	})
	if (!user) return null

	const forecasts = user.forecasts
		.filter(forecast => viewer?.id === id || !isSealed(phaseOf(forecast.market.season)))
		.map(forecast => ({
			market: forecast.market,
			percent: forecast.percent,
			points: forecast.market.outcome === null ? null : points(forecast.percent, forecast.market.outcome)
		}))
		.sort(
			(a, b) => b.market.season.year - a.market.season.year || a.market.title.localeCompare(b.market.title)
		)

	const years = [...new Set(forecasts.map(forecast => forecast.market.season.year))].sort((a, b) => b - a)
	const seasons = await Promise.all(
		years.map(async year => {
			const view = await loadSeason(year, viewer)
			const place = view ? view.standings.findIndex(standing => standing.user.id === id) : -1
			return {
				year,
				points: place >= 0 ? (view?.standings[place]?.points ?? 0) : null,
				place: place >= 0 ? place + 1 : null,
				of: view?.standings.length ?? 0
			}
		})
	)

	return {
		user,
		proposals: user.markets.map(market => ({
			...market,
			net: market.votes.reduce((sum, vote) => sum + vote.value, 0)
		})),
		forecasts,
		seasons
	}
}
