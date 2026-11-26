import Link from 'next/link'
import { ProfileForm } from '~/components/profile-form'
import { signOut } from '~/lib/actions'
import { requireUser } from '~/lib/session'

export const metadata = { title: 'Account' }

export default async function Account() {
	const user = await requireUser('/account')
	return (
		<>
			<h1 className="title" style={{ marginTop: 28 }}>
				{user.username}
			</h1>
			<p className="meta" style={{ marginTop: 10, marginBottom: 36 }}>
				Signed in as {user.email} · <Link href={`/users/${user.id}`}>Your profile</Link>
			</p>
			<ProfileForm username={user.username} bio={user.bio} />
			<form action={signOut} style={{ marginTop: 56 }}>
				<button className="button quiet" type="submit">
					Sign out
				</button>
			</form>
		</>
	)
}
