// One rule: a forecast scores 100 × (1 − 4 × miss²).
// A coin flip scores 0, certainty scores +100 when right and −300 when wrong.
export function points(percent: number, outcome: boolean) {
	const miss = percent / 100 - (outcome ? 1 : 0)
	return Math.round(100 * (1 - 4 * miss * miss))
}

export function median(values: number[]) {
	if (values.length === 0) return null
	const sorted = [...values].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	const upper = sorted[middle] ?? 0
	const lower = sorted[middle - 1] ?? upper
	return sorted.length % 2 === 1 ? upper : Math.round((lower + upper) / 2)
}

export function signed(value: number) {
	return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0'
}
