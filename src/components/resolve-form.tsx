'use client'

import { useActionState } from 'react'
import { type FormState, resolveMarket } from '~/lib/actions'

export function ResolveForm({
	marketId,
	outcome,
	note
}: {
	marketId: string
	outcome: boolean | null
	note: string | null
}) {
	const [state, action, pending] = useActionState<FormState, FormData>(resolveMarket, {
		error: null,
		fields: {}
	})
	return (
		<form className="form" action={action}>
			<input type="hidden" name="id" value={marketId} />
			<div className="panel-row">
				<span className="label">Resolve · admin</span>
			</div>
			<input
				className="input"
				name="note"
				defaultValue={note ?? ''}
				maxLength={500}
				placeholder="Source or note, optional"
			/>
			<div className="form-actions">
				<button
					type="submit"
					className="button"
					name="outcome"
					value="yes"
					disabled={pending || outcome === true}
				>
					Yes
				</button>
				<button
					type="submit"
					className="button quiet"
					name="outcome"
					value="no"
					disabled={pending || outcome === false}
				>
					No
				</button>
				{outcome !== null && (
					<button type="submit" className="link-button" name="outcome" value="open" disabled={pending}>
						Reopen
					</button>
				)}
			</div>
			{state.error && <p className="error">{state.error}</p>}
		</form>
	)
}
