'use client'

import { useActionState } from 'react'
import { requestSignIn, type SignInState } from '~/lib/actions'

export function SignInForm({ next }: { next: string }) {
	const [state, action, pending] = useActionState<SignInState, FormData>(requestSignIn, {
		error: null,
		sent: null,
		email: ''
	})

	if (state.sent)
		return (
			<div className="notice">
				Check <b>{state.sent}</b> for a link to sign in.
			</div>
		)

	return (
		<form className="form" action={action}>
			<input type="hidden" name="next" value={next} />
			<input
				className="input"
				type="email"
				name="email"
				required
				autoComplete="email"
				defaultValue={state.email}
				autoFocus
				placeholder="you@example.com"
				aria-label="Email"
			/>
			{state.error && <p className="error">{state.error}</p>}
			<button className="button" type="submit" disabled={pending}>
				Email me a link
			</button>
		</form>
	)
}
