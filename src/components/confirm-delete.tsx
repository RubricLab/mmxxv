'use client'

import { useState } from 'react'

export function ConfirmDelete({
	action,
	id,
	label
}: {
	action: (form: FormData) => Promise<void>
	id: string
	label: string
}) {
	const [armed, setArmed] = useState(false)
	if (!armed)
		return (
			<button type="button" className="link-button" onClick={() => setArmed(true)}>
				{label}
			</button>
		)
	return (
		<form action={action} style={{ display: 'inline-flex', gap: 12 }}>
			<input type="hidden" name="id" value={id} />
			<button type="submit" className="link-button negative">
				Confirm
			</button>
			<button type="button" className="link-button" onClick={() => setArmed(false)}>
				Keep
			</button>
		</form>
	)
}
