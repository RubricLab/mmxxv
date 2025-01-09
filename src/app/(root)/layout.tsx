import { ClientAuthProvider } from '@rubriclab/auth'
import type { ReactNode } from 'react'
import { getSession } from '~/actions/auth'
import { UsernamePrompt } from '~/components/username-prompt'
import '../globals.css'

export { metadata } from '~/constants'

export default async function RootLayout({
	children
}: {
	children: ReactNode
}) {
	// await main()
	const session = (await getSession({ redirectUnauthorizedUsers: false })) ?? {
		sessionKey: '',
		user: { id: '', authProviders: [] }
	}

	return (
		<html lang="en">
			<body>
				<ClientAuthProvider session={session}>
					{children}
					<UsernamePrompt />
				</ClientAuthProvider>
			</body>
		</html>
	)
}
