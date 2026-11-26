import { roman } from '~/lib/season'

// The first letter is rubricated, as scribes did.
export function Numeral({ year }: { year: number }) {
	const numeral = roman(year)
	return (
		<span aria-label={numeral} role="img">
			<span className="rubric">{numeral.slice(0, 1)}</span>
			{numeral.slice(1)}
		</span>
	)
}
