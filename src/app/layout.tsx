import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Brand } from '~/components/brand'
import { Numeral } from '~/components/numeral'
import { latestSeason, seasonYears } from '~/lib/data'
import { env } from '~/lib/env'
import { phaseOf, roman } from '~/lib/season'
import { currentUser } from '~/lib/session'
import './globals.css'

const serif = Instrument_Serif({ weight: '400', subsets: ['latin'], variable: '--font-serif' })
const sans = Geist({ subsets: ['latin'], variable: '--font-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export async function generateMetadata(): Promise<Metadata> {
	const season = await latestSeason()
	const name = roman(season.year)
	return {
		metadataBase: new URL(env.URL),
		title: { default: name, template: `%s · ${name}` },
		description: `A forecasting game for ${season.year}.`
	}
}

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#f5f2eb' },
		{ media: '(prefers-color-scheme: dark)', color: '#131210' }
	]
}

export default async function Layout({ children }: { children: ReactNode }) {
	const [season, years, user] = await Promise.all([latestSeason(), seasonYears(), currentUser()])
	const scoring = phaseOf(season) !== 'proposals'

	return (
		<html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
			<body>
				<div className="page">
					<header className="header">
						<Brand>
							<Numeral year={season.year} />
						</Brand>
						<nav className="nav">
							{scoring && <Link href="/standings">Standings</Link>}
							<Link href="/rules">Rules</Link>
							{user ? <Link href="/account">{user.username}</Link> : <Link href="/auth/signin">Sign in</Link>}
						</nav>
					</header>
					<main>{children}</main>
					<footer className="footer">
						<nav>
							{years.map(year => (
								<Link key={year} href={`/${year}`}>
									{roman(year)}
								</Link>
							))}
						</nav>
						<nav>
							<Link href="/rules">Rules</Link>
							<a href="https://github.com/RubricLab/mmxxv">Source</a>
						</nav>
					</footer>
				</div>
			</body>
		</html>
	)
}
