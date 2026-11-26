import { Numeral } from '~/components/numeral'
import { ScoreDemo } from '~/components/score-demo'
import { latestSeason } from '~/lib/data'
import { proposalsPerPlayer, roman } from '~/lib/season'
import { lastDay } from '~/lib/time'

export const metadata = { title: 'Rules' }

export default async function Rules() {
	const season = await latestSeason()
	return (
		<>
			<h1 className="numeral" style={{ fontSize: 'clamp(64px, 14vw, 120px)' }}>
				<Numeral year={season.year} />
			</h1>
			<p className="lede" style={{ marginBottom: 56 }}>
				Forecast the year with friends. Whoever sees it most clearly wins.
			</p>
			<ol className="rules">
				<li>
					<span className="step">{roman(1)}</span>
					<div>
						<h2>Propose</h2>
						<p>
							Until {lastDay(season.proposalsCloseAt)}, propose up to {proposalsPerPlayer} yes or no questions
							about {season.year} and vote on everyone else’s. The top {season.boardSize} make the board.
						</p>
					</div>
				</li>
				<li>
					<span className="step">{roman(2)}</span>
					<div>
						<h2>Forecast</h2>
						<p>
							Until {lastDay(season.forecastsLockAt)}, give every market on the board a probability. Forecasts
							stay sealed until they lock, so nobody copies anybody.
						</p>
					</div>
				</li>
				<li>
					<span className="step">{roman(3)}</span>
					<div>
						<h2>Watch</h2>
						<p>
							Markets resolve as {season.year} unfolds, each by its own criteria. Whatever hasn’t happened by{' '}
							{lastDay(season.endsAt)} resolves no.
						</p>
					</div>
				</li>
				<li>
					<span className="step">{roman(4)}</span>
					<div>
						<h2>Score</h2>
						<p>
							Each forecast scores 100 × (1 − 4 × miss²), where miss is how far you were from what happened. A
							coin flip scores 0. Certainty scores +100 when right and −300 when wrong. Skipped markets score
							0. Most points wins.
						</p>
						<ScoreDemo />
					</div>
				</li>
			</ol>
		</>
	)
}
