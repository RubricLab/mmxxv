'use client'

import { type CSSProperties, useState } from 'react'
import { points, signed } from '~/lib/score'

export function ScoreDemo() {
	const [value, setValue] = useState(70)
	const style: CSSProperties & { '--value': string } = { '--value': `${((value - 1) / 98) * 100}%` }
	const yes = points(value, true)
	const no = points(value, false)
	return (
		<div className="panel" style={{ marginTop: 18 }}>
			<div className="forecast-full">
				<div className="panel-row">
					<span className="label">Try it</span>
				</div>
				<div className="big num">
					{value}
					<small>%</small>
				</div>
				<input
					className="slider"
					type="range"
					min={1}
					max={99}
					value={value}
					style={style}
					aria-label="Example forecast"
					onChange={event => setValue(Number(event.target.value))}
				/>
				<div className="stakes">
					<span>
						If yes <span className={yes < 0 ? 'num negative' : 'num'}>{signed(yes)}</span>
					</span>
					<span>
						If no <span className={no < 0 ? 'num negative' : 'num'}>{signed(no)}</span>
					</span>
				</div>
			</div>
		</div>
	)
}
