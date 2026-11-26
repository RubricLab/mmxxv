import type { Season } from '~/generated/prisma/client'

export const proposalsPerPlayer = 5

// A season moves through four phases, set by three dates.
export type Phase = 'proposals' | 'forecasting' | 'live' | 'final'

export const phases: { phase: Phase; label: string; until: (season: Season) => Date | null }[] = [
	{ phase: 'proposals', label: 'Proposals', until: season => season.proposalsCloseAt },
	{ phase: 'forecasting', label: 'Forecasts', until: season => season.forecastsLockAt },
	{ phase: 'live', label: 'The year', until: season => season.endsAt },
	{ phase: 'final', label: 'Results', until: () => null }
]

export function phaseOf(season: Season, now = new Date()): Phase {
	if (now < season.proposalsCloseAt) return 'proposals'
	if (now < season.forecastsLockAt) return 'forecasting'
	if (now < season.endsAt) return 'live'
	return 'final'
}

// Forecasts stay sealed until they lock.
export function isSealed(phase: Phase) {
	return phase === 'proposals' || phase === 'forecasting'
}

export function roman(year: number) {
	const numerals: [number, string][] = [
		[1000, 'M'],
		[900, 'CM'],
		[500, 'D'],
		[400, 'CD'],
		[100, 'C'],
		[90, 'XC'],
		[50, 'L'],
		[40, 'XL'],
		[10, 'X'],
		[9, 'IX'],
		[5, 'V'],
		[4, 'IV'],
		[1, 'I']
	]
	let rest = year
	let out = ''
	for (const [value, numeral] of numerals) {
		while (rest >= value) {
			out += numeral
			rest -= value
		}
	}
	return out
}

// Proposals rank by net votes, then by who proposed first. The top boardSize make the board.
export function rankProposals<T extends { net: number; createdAt: Date }>(markets: T[]): T[] {
	return [...markets].sort((a, b) => b.net - a.net || a.createdAt.getTime() - b.createdAt.getTime())
}
