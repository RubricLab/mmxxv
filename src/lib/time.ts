const zone = 'America/New_York'
const day = 24 * 60 * 60 * 1000

export function formatDay(date: Date, withYear = false) {
	return date.toLocaleDateString('en-US', {
		timeZone: zone,
		month: 'short',
		day: 'numeric',
		...(withYear ? { year: 'numeric' } : {})
	})
}

// Phase boundaries sit at midnight, so the last full day is the day before.
export function lastDay(date: Date) {
	return formatDay(new Date(date.getTime() - 1))
}

export function timeLeft(until: Date, now = new Date()) {
	const ms = until.getTime() - now.getTime()
	if (ms >= 2 * day) return `${Math.floor(ms / day)} days`
	const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)))
	return hours === 1 ? '1 hour' : `${hours} hours`
}

export function timeAgo(date: Date, now = new Date()) {
	const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
	if (minutes < 1) return 'now'
	if (minutes < 60) return `${minutes}m`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h`
	const days = Math.floor(hours / 24)
	if (days < 30) return `${days}d`
	return formatDay(date, true)
}
