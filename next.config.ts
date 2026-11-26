import type { NextConfig } from 'next'

export default {
	reactStrictMode: true,
	agentRules: false,
	turbopack: { root: import.meta.dirname },
	async redirects() {
		return [
			{ source: '/about', destination: '/rules', permanent: true },
			{ source: '/leaderboard', destination: '/standings', permanent: true },
			{ source: '/markets', destination: '/', permanent: true },
			{ source: '/probabilities/:path*', destination: '/', permanent: true }
		]
	}
} satisfies NextConfig
