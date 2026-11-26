import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MarketForm } from '~/components/market-form'
import { Numeral } from '~/components/numeral'
import { latestSeason } from '~/lib/data'
import { db } from '~/lib/db'
import { phaseOf, proposalsPerPlayer } from '~/lib/season'
import { requireUser } from '~/lib/session'
import { lastDay } from '~/lib/time'

export const metadata = { title: 'Propose' }

export default async function Propose() {
	const user = await requireUser('/propose')
	const season = await latestSeason()
	if (phaseOf(season) !== 'proposals') redirect('/')
	const mine = await db.market.count({ where: { seasonYear: season.year, authorId: user.id } })

	return (
		<>
			<Link className="crumb" href="/">
				← <Numeral year={season.year} />
			</Link>
			<h1 className="title">Propose a market</h1>
			<p className="meta" style={{ marginTop: 10, marginBottom: 32 }}>
				A yes or no question about {season.year}. Proposals close {lastDay(season.proposalsCloseAt)} ·{' '}
				{proposalsPerPlayer - mine} of {proposalsPerPlayer} left
			</p>
			{mine < proposalsPerPlayer ? (
				<MarketForm market={null} />
			) : (
				<p className="notice">You’ve made all {proposalsPerPlayer} of your proposals.</p>
			)}
		</>
	)
}
