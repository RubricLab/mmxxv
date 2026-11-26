import { Fragment } from 'react'

// Plain text with links and @mentions. Old comments stored mentions as @[id:name].
export function RichText({ text }: { text: string }) {
	const clean = text.replace(/@\[[^:\]]+:([^\]]+)\]/g, '@$1')
	const parts = clean.split(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]|@[a-zA-Z0-9_]{2,20})/g)
	return (
		<>
			{parts.map((part, index) => {
				const key = `${index}${part.slice(0, 8)}`
				if (/^https?:\/\//.test(part))
					return (
						<a key={key} href={part} target="_blank" rel="noreferrer noopener">
							{part.replace(/^https?:\/\/(www\.)?/, '')}
						</a>
					)
				if (/^@[a-zA-Z0-9_]{2,20}$/.test(part))
					return (
						<span key={key} className="mention">
							{part}
						</span>
					)
				return <Fragment key={key}>{part}</Fragment>
			})}
		</>
	)
}
