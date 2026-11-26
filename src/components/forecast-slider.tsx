'use client'

import { type CSSProperties, useRef, useState, useTransition } from 'react'
import { forecast } from '~/lib/actions'
import { points, signed } from '~/lib/score'

function Stake({ label, value }: { label: string; value: number }) {
	return (
		<span>
			{label} <span className={value < 0 ? 'num negative' : 'num'}>{signed(value)}</span>
		</span>
	)
}

export function ForecastSlider({
	marketId,
	percent,
	full,
	disabled
}: {
	marketId: string
	percent: number | null
	full: boolean
	disabled: boolean
}) {
	const [value, setValue] = useState(percent ?? 50)
	const [unset, setUnset] = useState(percent === null)
	const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
	const [, startTransition] = useTransition()
	const committed = useRef(percent)

	function commit() {
		if (disabled) return
		setUnset(false)
		if (committed.current === value) return
		committed.current = value
		setStatus('saving')
		startTransition(async () => {
			await forecast(marketId, value)
			setStatus('saved')
		})
	}

	const style: CSSProperties & { '--value': string } = { '--value': `${((value - 1) / 98) * 100}%` }
	const input = (
		<input
			className="slider"
			type="range"
			min={1}
			max={99}
			step={1}
			value={value}
			disabled={disabled}
			data-unset={unset}
			style={style}
			aria-label="Your forecast, in percent"
			onChange={event => {
				setValue(Number(event.target.value))
				setUnset(false)
			}}
			onPointerUp={commit}
			onKeyUp={commit}
			onBlur={() => !unset && commit()}
		/>
	)

	if (!full)
		return (
			<div className="forecast-inline">
				{input}
				<span className="num">{unset ? '—' : `${value}%`}</span>
			</div>
		)

	return (
		<div className="forecast-full">
			<div className="panel-row">
				<span className="label">Your forecast</span>
				<span className="saved">{status === 'saving' ? 'Saving' : status === 'saved' ? 'Saved' : ''}</span>
			</div>
			<div className="big num">
				{unset ? '—' : value}
				{!unset && <small>%</small>}
			</div>
			{input}
			{unset ? (
				<div className="stakes">Drag to forecast</div>
			) : (
				<div className="stakes">
					<Stake label="If yes" value={points(value, true)} />
					<Stake label="If no" value={points(value, false)} />
				</div>
			)}
		</div>
	)
}
