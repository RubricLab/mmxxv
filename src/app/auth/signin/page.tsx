import { redirect } from 'next/navigation'
import { Numeral } from '~/components/numeral'
import { SignInForm } from '~/components/sign-in-form'
import { latestSeason } from '~/lib/data'
import { currentUser } from '~/lib/session'

export const metadata = { title: 'Sign in' }

export default async function SignIn({ searchParams }: PageProps<'/auth/signin'>) {
	const { next, expired } = await searchParams
	const target = typeof next === 'string' && /^\/(?!\/)/.test(next) ? next : '/'
	if (await currentUser()) redirect(target)
	const season = await latestSeason()

	return (
		<div className="signin">
			<h1 className="numeral">
				<Numeral year={season.year} />
			</h1>
			<p className="lede" style={{ marginBottom: 28 }}>
				{expired ? 'That link has expired. Here’s a fresh one.' : 'Sign in with your email.'}
			</p>
			<SignInForm next={target} />
		</div>
	)
}
