'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { editMarket, type FormState, proposeMarket } from '~/lib/actions'

type Market = { id: string; title: string; resolutionCriteria: string; description: string | null }

export function MarketForm({ market }: { market: Market | null }) {
	const [state, action, pending] = useActionState<FormState, FormData>(market ? editMarket : proposeMarket, {
		error: null,
		fields: {}
	})
	const value = (name: 'title' | 'resolutionCriteria' | 'description') =>
		state.fields[name] ?? market?.[name] ?? ''

	return (
		<form className="form" action={action}>
			{market && <input type="hidden" name="id" value={market.id} />}
			<label className="field">
				<span className="label">Question</span>
				<input
					className="input title-input"
					name="title"
					required
					maxLength={140}
					defaultValue={value('title')}
					placeholder="Will humans walk on the Moon?"
					autoFocus={!market}
				/>
			</label>
			<label className="field">
				<span className="label">Resolves yes if</span>
				<textarea
					className="textarea"
					name="resolutionCriteria"
					required
					maxLength={600}
					defaultValue={value('resolutionCriteria')}
					placeholder="A crewed mission lands on the lunar surface before the end of the year, confirmed by the space agency."
				/>
				<span className="hint">Anything else resolves no.</span>
			</label>
			<label className="field">
				<span className="label">Context</span>
				<textarea
					className="textarea"
					name="description"
					maxLength={1000}
					defaultValue={value('description')}
					placeholder="Optional. Links, background, why it matters."
				/>
			</label>
			{state.error && <p className="error">{state.error}</p>}
			<div className="form-actions">
				<button className="button" type="submit" disabled={pending}>
					{market ? 'Save' : 'Propose'}
				</button>
				<Link className="meta" href={market ? `/markets/${market.id}` : '/'}>
					Cancel
				</Link>
			</div>
		</form>
	)
}
