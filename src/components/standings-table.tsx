import Link from 'next/link'
import type { Standing } from '~/lib/data'
import { signed } from '~/lib/score'

export function StandingsTable({ standings, viewerId }: { standings: Standing[]; viewerId: string | null }) {
	return (
		<table className="table">
			<thead>
				<tr>
					<th className="place">#</th>
					<th>Player</th>
					<th className="right hide-small">Scored</th>
					<th className="right">Points</th>
				</tr>
			</thead>
			<tbody>
				{standings.map((standing, index) => (
					<tr key={standing.user.id} data-me={standing.user.id === viewerId}>
						<td className="place">{index + 1}</td>
						<td className="player">
							<Link href={`/users/${standing.user.id}`}>{standing.user.username}</Link>
						</td>
						<td className="right num meta hide-small">
							{standing.scored}/{standing.forecasts}
						</td>
						<td className={standing.points < 0 ? 'right num negative' : 'right num'}>
							{signed(standing.points)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	)
}
