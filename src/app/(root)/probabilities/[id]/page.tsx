import { notFound, redirect } from 'next/navigation'
import { getSession } from '~/actions/auth'
import Nav from '~/components/nav'
import { ProbabilityAssignment } from '~/components/probability-assignment'
import UserPill from '~/components/user-pill'
import { db } from '~/db'
import { formatDate } from '~/utils/date'

// January 20, 2025 at midnight EST = January 21, 2025 at 05:00 UTC
const PROBABILITIES_START_DATE = new Date('2025-01-21T05:00:00.000Z')

export default async function MarketProbabilityPage({
	params
}: { params: Promise<{ id: string }> }) {
	// Redirect if before the start date
	if (new Date() < PROBABILITIES_START_DATE) {
		redirect('/markets')
	}

	const { id } = await params

	const { user } = await getSession()

	const market = await db.market.findUnique({
		where: { id },
		include: {
			author: {
				select: {
					id: true,
					email: true,
					username: true
				}
			},
			predictions: {
				select: {
					userId: true,
					probability: true,
					user: {
						select: {
							id: true,
							email: true,
							username: true
						}
					}
				}
			}
		}
	})

	if (!market) {
		notFound()
	}

	const userPrediction = market.predictions.find(p => p.userId === user.id)?.probability
	const averageProbability = market.predictions.length
		? market.predictions.reduce((sum, p) => sum + p.probability, 0) / market.predictions.length
		: null

	return (
		<>
			<Nav />
			<div className="container">
				<div className="card">
					<div className="card-header">
						<h1 className="title" style={{ margin: 0, borderBottom: 'none', fontFamily: 'inherit' }}>
							{market.title}
						</h1>
					</div>
					<div className="section-content">
						<p>{market.description}</p>
						<p className="mt-2 text-gray-500 text-sm">
							Posted by <UserPill {...market.author} /> on {formatDate(market.createdAt)}
						</p>
					</div>
					<div className="section">
						<h2 className="section-title">Assign Your Probability</h2>
						<div className="section-content">
							<ProbabilityAssignment marketId={market.id} initialProbability={userPrediction} />
						</div>
					</div>
					<div className="section">
						<h2 className="section-title">Current Probability</h2>
						<p className="section-content">
							{averageProbability !== null
								? `${(averageProbability * 100).toFixed(1)}% (based on ${market.predictions.length} predictions)`
								: 'No predictions yet'}
						</p>
					</div>
					{market.predictions.length > 0 && (
						<div className="section">
							<h2 className="section-title">Individual Predictions</h2>
							<div className="overflow-x-auto">
								<table className="table">
									<thead>
										<tr>
											<th>USER</th>
											<th>PROBABILITY</th>
										</tr>
									</thead>
									<tbody>
										{market.predictions.map(prediction => (
											<tr key={prediction.userId}>
												<td>
													<UserPill {...prediction.user} />
												</td>
												<td>{(prediction.probability * 100).toFixed(1)}%</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	)
}