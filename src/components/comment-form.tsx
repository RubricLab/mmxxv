'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { addComment, type FormState } from '~/lib/actions'

export function CommentForm({ marketId, parentId }: { marketId: string; parentId: string | null }) {
	const [open, setOpen] = useState(parentId === null)
	const [state, action, pending] = useActionState<FormState, FormData>(addComment, {
		error: null,
		fields: {}
	})
	const form = useRef<HTMLFormElement>(null)
	const submitted = useRef(false)

	useEffect(() => {
		if (pending) submitted.current = true
		else if (submitted.current && !state.error) {
			submitted.current = false
			form.current?.reset()
			if (parentId) setOpen(false)
		}
	}, [pending, state, parentId])

	if (!open)
		return (
			<button type="button" className="link-button" onClick={() => setOpen(true)}>
				Reply
			</button>
		)

	return (
		<form ref={form} action={action} className={parentId ? 'form reply-form' : 'form'}>
			<input type="hidden" name="marketId" value={marketId} />
			<input type="hidden" name="parentId" value={parentId ?? ''} />
			<textarea
				className="textarea"
				name="content"
				required
				maxLength={2000}
				defaultValue={state.fields.content ?? ''}
				placeholder={parentId ? 'Reply' : 'Add to the discussion. @mention someone to tell them.'}
				autoFocus={parentId !== null}
				onKeyDown={event => {
					if (event.key === 'Enter' && (event.metaKey || event.ctrlKey))
						event.currentTarget.form?.requestSubmit()
				}}
			/>
			{state.error && <p className="error">{state.error}</p>}
			<div className="form-actions">
				<button className="button" type="submit" disabled={pending}>
					{parentId ? 'Reply' : 'Comment'}
				</button>
				{parentId && (
					<button type="button" className="link-button" onClick={() => setOpen(false)}>
						Cancel
					</button>
				)}
			</div>
		</form>
	)
}
