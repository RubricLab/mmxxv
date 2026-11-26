'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Season pages carry the numeral large, so the header stays quiet there.
export function Brand({ children }: { children: ReactNode }) {
	const quiet = /^\/(\d{4})?$/.test(usePathname())
	return (
		<Link href="/" className="brand" aria-hidden={quiet} tabIndex={quiet ? -1 : 0} data-quiet={quiet}>
			{children}
		</Link>
	)
}
