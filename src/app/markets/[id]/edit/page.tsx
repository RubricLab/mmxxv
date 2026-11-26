import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { MarketForm } from '~/components/market-form'
import { db } from '~/lib/db'
import { phaseOf } from '~/lib/season'
import { requireUser } from '~/lib/session'

export const metadata = { title: 'Edit' }

export default async function Edit({ params }: PageProps<'/markets/[id]/edit'>) {
	const { id } = await params
	const user = await requireUser(`/markets/${id}/edit`)
	const market = await db.market.findUnique({
		where: { id },
		select: {
			id: true,
			title: true,
			resolutionCriteria: true,
			description: true,
			authorId: true,
			season: true
		}
	})
	if (!market) notFound()
	if (market.authorId !== user.id || phaseOf(market.season) !== 'proposals') redirect(`/markets/${id}`)

	return (
		<>
			<Link className="crumb" href={`/markets/${id}`}>
				← Back
			</Link>
			<h1 className="title" style={{ marginBottom: 32 }}>
				Edit
			</h1>
			<MarketForm market={market} />
		</>
	)
}
