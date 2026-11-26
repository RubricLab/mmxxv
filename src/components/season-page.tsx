import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ForecastSlider } from '~/components/forecast-slider'
import { Numeral } from '~/components/numeral'
import { StandingsTable } from '~/components/standings-table'
import { VoteButtons } from '~/components/vote-buttons'
import type { Season } from '~/generated/prisma/client'
import { loadSeason, type Row } from '~/lib/data'
import { signed } from '~/lib/score'
import { type Phase, phases, proposalsPerPlayer } from '~/lib/season'
import { currentUser } from '~/lib/session'
import { formatDay, lastDay, timeLeft } from '~/lib/time'

function pad(rank: number) {
	return String(rank).padStart(2, '0')
}

function Rail({ season, phase }: { season: Season; phase: Phase }) {
	const now = phases.findIndex(step => step.phase === phase)
	return (
		<ol className="rail">
			{phases.map((step, index) => {
				const until = step.until(season)
				return (
					<li key={step.phase} data-state={index < now ? 'past' : index === now ? 'now' : 'next'}>
						<div className="label">{step.label}</div>
						<div className="meta">
							{step.phase === 'live'
								? `Through ${lastDay(season.endsAt)}`
								: until
									? `Until ${lastDay(until)}`
									: `From ${formatDay(season.endsAt)}`}
						</div>
					</li>
				)
			})}
		</ol>
	)
}

function Meta({ row }: { row: Row }) {
	return (
		<p className="row-meta">
			<Link href={`/users/${row.author.id}`}>{row.author.username}</Link>
			{row.comments > 0 && ` · ${row.comments} ${row.comments === 1 ? 'comment' : 'comments'}`}
		</p>
	)
}

function Figure({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
	return (
		<div className="figure" data-empty={value === ''}>
			<span className={negative ? 'num negative' : 'num'}>{value}</span>
			<span className="label">{label}</span>
		</div>
	)
}

function Proposals({
	rows,
	season,
	viewerId,
	mine
}: {
	rows: Row[]
	season: Season
	viewerId: string | null
	mine: number
}) {
	const empty = Math.max(0, season.boardSize - rows.length)
	return (
		<section className="section">
			<div className="section-head">
				<div>
					<h2>Proposals</h2>
					<p className="meta">
						The top {season.boardSize} make the board
						{viewerId && ` · ${mine} of ${proposalsPerPlayer} yours`}
					</p>
				</div>
				{mine < proposalsPerPlayer && (
					<Link className="button" href="/propose">
						Propose
					</Link>
				)}
			</div>
			<ol className="list">
				{rows.map(row => (
					<li key={row.id}>
						<div className="row">
							<span className="row-rank">{pad(row.rank)}</span>
							<div>
								<Link className="row-title" href={`/markets/${row.id}`}>
									{row.title}
								</Link>
								<Meta row={row} />
							</div>
							<div className="row-side">
								<VoteButtons
									marketId={row.id}
									net={row.net}
									myVote={row.myVote}
									disabled={row.author.id === viewerId}
									large={false}
								/>
							</div>
						</div>
						{row.rank === season.boardSize && rows.length > season.boardSize && (
							<div className="cut">
								<span className="label">The board ↑</span>
							</div>
						)}
					</li>
				))}
				{Array.from({ length: empty }, (_, index) => {
					const rank = rows.length + index + 1
					return (
						<li key={rank} className="row slot" aria-hidden="true">
							<span className="row-rank">{pad(rank)}</span>
						</li>
					)
				})}
			</ol>
		</section>
	)
}

function Board({ rows, phase, viewerId }: { rows: Row[]; phase: Phase; viewerId: string | null }) {
	const done = rows.filter(row => row.myForecast !== null).length
	return (
		<section className="section">
			<div className="section-head">
				<div>
					<h2>The board</h2>
					<p className="meta">
						{phase === 'forecasting'
							? viewerId
								? `${done} of ${rows.length} forecast · sealed until they lock`
								: 'Forecasts stay sealed until they lock'
							: `Crowd is the median forecast`}
					</p>
				</div>
				{phase === 'forecasting' && !viewerId && (
					<Link className="button" href="/auth/signin">
						Sign in to forecast
					</Link>
				)}
			</div>
			<ol className="list">
				{rows.map(row => (
					<li key={row.id} className="row">
						<span className="row-rank">{pad(row.rank)}</span>
						<div>
							<Link className="row-title" href={`/markets/${row.id}`}>
								{row.title}
							</Link>
							<Meta row={row} />
						</div>
						<div className="row-side">
							{phase === 'forecasting' ? (
								<ForecastSlider
									marketId={row.id}
									percent={row.myForecast}
									full={false}
									disabled={!viewerId}
								/>
							) : (
								<>
									<Figure label="Crowd" value={row.crowd === null ? '—' : `${row.crowd}%`} />
									{viewerId && (
										<Figure label="You" value={row.myForecast === null ? '—' : `${row.myForecast}%`} />
									)}
									<span className="outcome">
										{row.outcome !== null && (
											<span className={row.outcome ? 'chip yes' : 'chip no'}>
												{row.outcome ? 'Yes' : 'No'}
											</span>
										)}
									</span>
									{viewerId && (
										<Figure
											label="Points"
											value={row.myPoints === null ? '' : signed(row.myPoints)}
											negative={row.myPoints !== null && row.myPoints < 0}
										/>
									)}
								</>
							)}
						</div>
					</li>
				))}
			</ol>
		</section>
	)
}

function Archive({ rows }: { rows: Row[] }) {
	return (
		<section className="section">
			<div className="section-head">
				<div>
					<h2>Proposals</h2>
					<p className="meta">{rows.length} proposed, never played</p>
				</div>
			</div>
			<ol className="list">
				{rows.map(row => (
					<li key={row.id} className="row">
						<span className="row-rank">{pad(row.rank)}</span>
						<div>
							<Link className="row-title" href={`/markets/${row.id}`}>
								{row.title}
							</Link>
							<Meta row={row} />
						</div>
						<div className="row-side">
							<Figure label="Votes" value={signed(row.net)} />
						</div>
					</li>
				))}
			</ol>
		</section>
	)
}

export async function SeasonPage({ year }: { year: number }) {
	const viewer = await currentUser()
	const view = await loadSeason(year, viewer)
	if (!view) notFound()
	const { season, phase, rows, board, standings, players, resolved } = view
	const viewerId = viewer?.id ?? null
	const played = season.boardSize > 0
	const me = standings.findIndex(standing => standing.user.id === viewerId)

	const status = !played
		? null
		: phase === 'proposals'
			? `Proposals close in ${timeLeft(season.proposalsCloseAt)}.`
			: phase === 'forecasting'
				? `Forecasts lock in ${timeLeft(season.forecastsLockAt)}.${players ? ` ${players} ${players === 1 ? 'player has' : 'players have'} forecast.` : ''}`
				: phase === 'live'
					? `${resolved} of ${board.length} resolved. The year ends in ${timeLeft(season.endsAt)}.`
					: resolved === board.length
						? 'Final.'
						: `${resolved} of ${board.length} resolved.`

	return (
		<>
			<h1 className="numeral">
				<Numeral year={season.year} />
			</h1>
			<p className="lede">A forecasting game for {season.year}.</p>
			{played && <Rail season={season} phase={phase} />}
			{status && <p className="status">{status}</p>}

			{played && phase !== 'proposals' && phase !== 'forecasting' && viewerId && me >= 0 && (
				<div className="ledger">
					<div>
						<span className="label">Your points</span>
						<span className="num">{signed(standings[me]?.points ?? 0)}</span>
					</div>
					<div>
						<span className="label">Place</span>
						<span className="num">
							{me + 1}
							<span className="meta"> of {standings.length}</span>
						</span>
					</div>
					<div>
						<span className="label">Resolved</span>
						<span className="num">
							{resolved}
							<span className="meta"> of {board.length}</span>
						</span>
					</div>
				</div>
			)}

			{!played ? (
				<Archive rows={rows} />
			) : phase === 'proposals' ? (
				<Proposals
					rows={rows}
					season={season}
					viewerId={viewerId}
					mine={rows.filter(row => row.author.id === viewerId).length}
				/>
			) : (
				<Board rows={board} phase={phase} viewerId={viewerId} />
			)}

			{standings.length > 0 && (
				<section className="section">
					<div className="section-head">
						<h2>Standings</h2>
						<Link className="meta" href={`/standings/${season.year}`}>
							All {standings.length}
						</Link>
					</div>
					<StandingsTable standings={standings.slice(0, 5)} viewerId={viewerId} />
				</section>
			)}
		</>
	)
}
