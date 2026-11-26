import Link from 'next/link'

export default function NotFound() {
	return (
		<>
			<h1 className="numeral">
				<span className="rubric">N</span>ihil
			</h1>
			<p className="lede">
				Nothing here. <Link href="/">Back to the game.</Link>
			</p>
		</>
	)
}
