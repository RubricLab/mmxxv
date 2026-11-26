import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SeasonPage } from '~/components/season-page'
import { roman } from '~/lib/season'

function parseYear(value: string) {
	return /^\d{4}$/.test(value) ? Number(value) : null
}

export async function generateMetadata({ params }: PageProps<'/[year]'>): Promise<Metadata> {
	const year = parseYear((await params).year)
	return year ? { title: { absolute: roman(year) } } : {}
}

export default async function Season({ params }: PageProps<'/[year]'>) {
	const year = parseYear((await params).year)
	if (!year) notFound()
	return <SeasonPage year={year} />
}
