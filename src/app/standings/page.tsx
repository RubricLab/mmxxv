import { StandingsPage } from '~/components/standings-page'
import { latestSeason } from '~/lib/data'

export const metadata = { title: 'Standings' }

export default async function Standings() {
	const season = await latestSeason()
	return <StandingsPage year={season.year} />
}
