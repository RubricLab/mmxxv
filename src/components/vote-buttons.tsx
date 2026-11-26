'use client'

import { useOptimistic, useTransition } from 'react'
import { vote } from '~/lib/actions'

function Chevron({ up }: { up: boolean }) {
	return (
		<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
			<path
				d={up ? 'M3 9l4-4 4 4' : 'M3 5l4 4 4-4'}
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function VoteButtons({
	marketId,
	net,
	myVote,
	disabled,
	large
}: {
	marketId: string
	net: number
	myVote: number
	disabled: boolean
	large: boolean
}) {
	const [state, setState] = useOptimistic({ net, myVote })
	const [, startTransition] = useTransition()

	function cast(value: 1 | -1) {
		startTransition(async () => {
			const next = state.myVote === value ? 0 : value
			setState({ net: state.net - state.myVote + next, myVote: next })
			await vote(marketId, value)
		})
	}

	return (
		<div className={large ? 'vote large' : 'vote'}>
			<button
				type="button"
				aria-label="Vote up"
				aria-pressed={state.myVote === 1}
				disabled={disabled}
				onClick={() => cast(1)}
			>
				<Chevron up />
			</button>
			<span className="num">{state.net < 0 ? `−${-state.net}` : state.net}</span>
			<button
				type="button"
				aria-label="Vote down"
				aria-pressed={state.myVote === -1}
				disabled={disabled}
				onClick={() => cast(-1)}
			>
				<Chevron up={false} />
			</button>
		</div>
	)
}
