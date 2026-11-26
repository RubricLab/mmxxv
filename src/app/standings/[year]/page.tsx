import { notFound } from 'next/navigation'
import { StandingsPage } from '~/components/standings-page'

export const metadata = { title: 'Standings' }

export default async function Standings({ params }: PageProps<'/standings/[year]'>) {
	const { year } = await params
	if (!/^\d{4}$/.test(year)) notFound()
	return <StandingsPage year={Number(year)} />
}
