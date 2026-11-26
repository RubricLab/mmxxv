import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Numeral } from '~/components/numeral'
import { StandingsTable } from '~/components/standings-table'
import { loadSeason } from '~/lib/data'
import { currentUser } from '~/lib/session'

export async function StandingsPage({ year }: { year: number }) {
	const viewer = await currentUser()
	const view = await loadSeason(year, viewer)
	if (!view) notFound()
	const { season, phase, standings, players, resolved, board } = view

	return (
		<>
			<Link className="crumb" href={`/${season.year}`}>
				← <Numeral year={season.year} />
			</Link>
			<h1 className="title">Standings</h1>
			<p className="meta" style={{ marginTop: 10 }}>
				{phase === 'proposals'
					? 'Standings begin once forecasts lock.'
					: phase === 'forecasting'
						? `${players} ${players === 1 ? 'player has' : 'players have'} forecast. Standings open when forecasts lock.`
						: `${resolved} of ${board.length} markets resolved · scored by 100 × (1 − 4 × miss²)`}
			</p>
			{standings.length > 0 && (
				<div className="section" style={{ marginTop: 40 }}>
					<StandingsTable standings={standings} viewerId={viewer?.id ?? null} />
				</div>
			)}
		</>
	)
}
