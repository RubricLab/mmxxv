'use client'

export default function Invite() {
	return <button onClick={() => {
		navigator.clipboard.writeText(window.location.href)
	}} className="button">Copy Invite Link</button>
}