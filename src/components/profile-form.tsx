'use client'

import { useActionState } from 'react'
import { type FormState, updateProfile } from '~/lib/actions'

export function ProfileForm({ username, bio }: { username: string; bio: string | null }) {
	const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {
		error: null,
		fields: {}
	})
	return (
		<form className="form" action={action}>
			<label className="field">
				<span className="label">Username</span>
				<input
					className="input"
					name="username"
					required
					maxLength={20}
					defaultValue={state.fields.username ?? username}
				/>
			</label>
			<label className="field">
				<span className="label">Bio</span>
				<input
					className="input"
					name="bio"
					maxLength={160}
					defaultValue={state.fields.bio ?? bio ?? ''}
					placeholder="Optional"
				/>
			</label>
			{state.error && <p className="error">{state.error}</p>}
			<div className="form-actions">
				<button className="button" type="submit" disabled={pending}>
					Save
				</button>
			</div>
		</form>
	)
}
