import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Comments } from '~/components/comments'
import { ConfirmDelete } from '~/components/confirm-delete'
import { ForecastSlider } from '~/components/forecast-slider'
import { Numeral } from '~/components/numeral'
import { ResolveForm } from '~/components/resolve-form'
import { RichText } from '~/components/rich-text'
import { VoteButtons } from '~/components/vote-buttons'
import { deleteMarket } from '~/lib/actions'
import { loadMarket } from '~/lib/data'
import { db } from '~/lib/db'
import { signed } from '~/lib/score'
import { currentUser } from '~/lib/session'
import { formatDay, lastDay } from '~/lib/time'

export async function generateMetadata({ params }: PageProps<'/markets/[id]'>): Promise<Metadata> {
	const market = await db.market.findUnique({ where: { id: (await params).id }, select: { title: true } })
	return market ? { title: market.title } : {}
}

function Distribution({
	forecasts,
	crowd,
	mine
}: {
	forecasts: { user: { id: string }; percent: number }[]
	crowd: number | null
	mine: string | null
}) {
	const stack = new Map<number, number>()
	return (
		<>
			<div className="dist" aria-hidden="true">
				<div className="dist-axis" />
				{forecasts.map(forecast => {
					const bucket = Math.round(forecast.percent / 3)
					const level = stack.get(bucket) ?? 0
					stack.set(bucket, level + 1)
					return (
						<span
							key={forecast.user.id}
							className={forecast.user.id === mine ? 'dist-dot mine' : 'dist-dot'}
							style={{ left: `${forecast.percent}%`, transform: `translateY(${-Math.min(level, 2) * 9}px)` }}
						/>
					)
				})}
				{crowd !== null && (
					<div className="dist-crowd" style={{ left: `${crowd}%` }}>
						<span style={crowd > 72 ? { left: 'auto', right: 6 } : undefined}>Crowd {crowd}%</span>
					</div>
				)}
			</div>
			<div className="dist-ticks">
				<span>0</span>
				<span>50</span>
				<span>100</span>
			</div>
		</>
	)
}

export default async function MarketPage({ params }: PageProps<'/markets/[id]'>) {
	const { id } = await params
	const viewer = await currentUser()
	const view = await loadMarket(id, viewer)
	if (!view) notFound()
	const {
		market,
		phase,
		rank,
		total,
		onBoard,
		net,
		myVote,
		myForecast,
		forecastCount,
		forecasts,
		crowd,
		comments
	} = view
	const season = market.season
	const played = season.boardSize > 0
	const own = viewer?.id === market.author.id
	const mine = forecasts.find(forecast => forecast.user.id === viewer?.id)

	return (
		<>
			<Link className="crumb" href={`/${season.year}`}>
				← <Numeral year={season.year} />
			</Link>

			<div className="eyebrow">
				{phase === 'proposals' || !played ? (
					<>
						<span className="chip">Proposal</span>
						{played && onBoard && <span className="chip board">On track for the board</span>}
					</>
				) : market.outcome !== null ? (
					<span className={market.outcome ? 'chip yes' : 'chip no'}>
						Resolved {market.outcome ? 'yes' : 'no'}
					</span>
				) : onBoard ? (
					<span className="chip board">On the board</span>
				) : (
					<span className="chip">Didn’t make the board</span>
				)}
			</div>

			<h1 className="title">{market.title}</h1>

			<div className="criteria">
				<span className="label">Resolves yes if</span>
				<p>
					<RichText text={market.resolutionCriteria} />
				</p>
			</div>

			{market.description && (
				<p className="context prose">
					<RichText text={market.description} />
				</p>
			)}

			<div className="byline meta">
				<span>
					Proposed by <Link href={`/users/${market.author.id}`}>{market.author.username}</Link> ·{' '}
					{formatDay(market.createdAt, true)}
				</span>
				{own && phase === 'proposals' && <Link href={`/markets/${market.id}/edit`}>Edit</Link>}
				{((own && phase === 'proposals') || viewer?.admin) && (
					<ConfirmDelete action={deleteMarket} id={market.id} label="Delete" />
				)}
			</div>

			{played && phase === 'proposals' && (
				<div className="panel">
					<div className="panel-row">
						<VoteButtons marketId={market.id} net={net} myVote={myVote} disabled={own} large />
						<p className="meta" style={{ flex: 1, minWidth: 200 }}>
							{own ? 'Your proposal. ' : ''}Ranked {rank} of {total}. The top {season.boardSize} make the
							board when proposals close {lastDay(season.proposalsCloseAt)}.
						</p>
					</div>
				</div>
			)}

			{phase === 'forecasting' && onBoard && (
				<div className="panel">
					<ForecastSlider marketId={market.id} percent={myForecast} full disabled={!viewer} />
					<p className="meta" style={{ marginTop: 16 }}>
						{viewer ? (
							`${forecastCount === 0 ? 'Forecasts stay' : `${forecastCount} ${forecastCount === 1 ? 'forecast' : 'forecasts'}`} sealed until ${lastDay(season.forecastsLockAt)}. Change yours until then.`
						) : (
							<Link href={`/auth/signin?next=/markets/${market.id}`}>Sign in to forecast</Link>
						)}
					</p>
				</div>
			)}

			{(phase === 'live' || phase === 'final') && onBoard && (
				<div className="panel">
					<div className="panel-row" style={{ marginBottom: 6 }}>
						<span className="label">
							{forecasts.length} {forecasts.length === 1 ? 'forecast' : 'forecasts'}
						</span>
						{market.resolvedAt && <span className="meta">Resolved {formatDay(market.resolvedAt, true)}</span>}
					</div>
					{forecasts.length > 0 && (
						<Distribution forecasts={forecasts} crowd={crowd} mine={viewer?.id ?? null} />
					)}
					{market.resolutionNote && (
						<p className="prose" style={{ marginTop: 18 }}>
							<RichText text={market.resolutionNote} />
						</p>
					)}
					{forecasts.length > 0 && (
						<table className="table" style={{ marginTop: 22 }}>
							<thead>
								<tr>
									<th>Player</th>
									<th className="right">Forecast</th>
									{market.outcome !== null && <th className="right">Points</th>}
								</tr>
							</thead>
							<tbody>
								{forecasts.map(forecast => (
									<tr key={forecast.user.id} data-me={forecast.user.id === viewer?.id}>
										<td className="player">
											<Link href={`/users/${forecast.user.id}`}>{forecast.user.username}</Link>
										</td>
										<td className="right num">{forecast.percent}%</td>
										{forecast.points !== null && (
											<td className={forecast.points < 0 ? 'right num negative' : 'right num'}>
												{signed(forecast.points)}
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					)}
					{viewer && !mine && <p className="meta">You didn’t forecast this one.</p>}
				</div>
			)}

			{viewer?.admin && onBoard && (phase === 'live' || phase === 'final') && (
				<div className="panel">
					<ResolveForm marketId={market.id} outcome={market.outcome} note={market.resolutionNote} />
				</div>
			)}

			<Comments comments={comments} marketId={market.id} viewer={viewer} />
		</>
	)
}
