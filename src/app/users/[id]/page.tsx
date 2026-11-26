import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadUser } from '~/lib/data'
import { db } from '~/lib/db'
import { signed } from '~/lib/score'
import { roman } from '~/lib/season'
import { currentUser } from '~/lib/session'
import { formatDay } from '~/lib/time'

export async function generateMetadata({ params }: PageProps<'/users/[id]'>): Promise<Metadata> {
	const user = await db.user.findUnique({ where: { id: (await params).id }, select: { username: true } })
	return user ? { title: user.username } : {}
}

export default async function Profile({ params }: PageProps<'/users/[id]'>) {
	const { id } = await params
	const viewer = await currentUser()
	const view = await loadUser(id, viewer)
	if (!view) notFound()
	const { user, proposals, forecasts, seasons } = view

	return (
		<>
			<h1 className="title" style={{ marginTop: 28 }}>
				{user.username}
			</h1>
			{user.bio && (
				<p className="lede" style={{ marginTop: 10 }}>
					{user.bio}
				</p>
			)}
			<p className="meta" style={{ marginTop: 12 }}>
				Playing since {formatDay(user.createdAt, true)}
				{viewer?.id === user.id && (
					<>
						{' · '}
						<Link href="/account">Edit</Link>
					</>
				)}
			</p>

			{seasons.some(season => season.place !== null) && (
				<div className="ledger">
					{seasons.map(
						season =>
							season.place !== null && (
								<div key={season.year}>
									<span className="label">{roman(season.year)}</span>
									<span className={season.points !== null && season.points < 0 ? 'num negative' : 'num'}>
										{signed(season.points ?? 0)}
									</span>
									<span className="meta">
										{season.place} of {season.of}
									</span>
								</div>
							)
					)}
				</div>
			)}

			{forecasts.length > 0 && (
				<section className="section">
					<div className="section-head">
						<h2>Forecasts</h2>
						<span className="meta">{forecasts.length}</span>
					</div>
					<ol className="list">
						{forecasts.map(forecast => (
							<li key={forecast.market.id} className="row">
								<span className="row-rank">{roman(forecast.market.season.year)}</span>
								<div>
									<Link className="row-title" href={`/markets/${forecast.market.id}`}>
										{forecast.market.title}
									</Link>
								</div>
								<div className="row-side">
									<div className="figure">
										<span className="num">{forecast.percent}%</span>
										<span className="label">Forecast</span>
									</div>
									{forecast.market.outcome !== null && (
										<span className={forecast.market.outcome ? 'chip yes' : 'chip no'}>
											{forecast.market.outcome ? 'Yes' : 'No'}
										</span>
									)}
									{forecast.points !== null && (
										<div className="figure">
											<span className={forecast.points < 0 ? 'num negative' : 'num'}>
												{signed(forecast.points)}
											</span>
											<span className="label">Points</span>
										</div>
									)}
								</div>
							</li>
						))}
					</ol>
				</section>
			)}

			{proposals.length > 0 && (
				<section className="section">
					<div className="section-head">
						<h2>Proposals</h2>
						<span className="meta">{proposals.length}</span>
					</div>
					<ol className="list">
						{proposals.map(market => (
							<li key={market.id} className="row">
								<span className="row-rank">{roman(market.seasonYear)}</span>
								<div>
									<Link className="row-title" href={`/markets/${market.id}`}>
										{market.title}
									</Link>
								</div>
								<div className="row-side">
									<div className="figure">
										<span className="num">{signed(market.net)}</span>
										<span className="label">Votes</span>
									</div>
								</div>
							</li>
						))}
					</ol>
				</section>
			)}
		</>
	)
}
