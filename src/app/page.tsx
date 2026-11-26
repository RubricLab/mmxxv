import { SeasonPage } from '~/components/season-page'
import { latestSeason } from '~/lib/data'

export default async function Home() {
	const season = await latestSeason()
	return <SeasonPage year={season.year} />
}
