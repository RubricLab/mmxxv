import { ImageResponse } from 'next/og'
import { latestSeason } from '~/lib/data'
import { roman } from '~/lib/season'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'A forecasting game'

async function serif(text: string) {
	const css = await fetch(
		`https://fonts.googleapis.com/css2?family=Instrument+Serif&text=${encodeURIComponent(text)}`
	)
	const url = (await css.text()).match(/src: url\((.+?)\) format/)?.[1]
	if (!url) throw new Error('Instrument Serif did not load')
	return (await fetch(url)).arrayBuffer()
}

export default async function Image() {
	const season = await latestSeason()
	const name = roman(season.year)
	const line = `A forecasting game for ${season.year}.`
	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				padding: '0 96px',
				background: '#f5f2eb',
				color: '#1a1815',
				fontFamily: 'Instrument Serif'
			}}
		>
			<div style={{ display: 'flex', fontSize: 250, lineHeight: 0.9, letterSpacing: -7 }}>
				<span style={{ color: '#c2391b' }}>{name.slice(0, 1)}</span>
				{name.slice(1)}
			</div>
			<div style={{ fontSize: 58, color: '#4a463f', marginTop: 44 }}>{line}</div>
		</div>,
		{
			...size,
			fonts: [{ name: 'Instrument Serif', data: await serif(name + line), style: 'normal', weight: 400 }]
		}
	)
}
