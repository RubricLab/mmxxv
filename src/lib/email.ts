import { Resend } from 'resend'
import { env } from '~/lib/env'

const resend = new Resend(env.RESEND_API_KEY)

function escapeHtml(text: string) {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function page({
	name,
	lines,
	action
}: {
	name: string
	lines: string[]
	action: { label: string; url: string }
}) {
	return `<!doctype html><html><body style="margin:0;background:#f5f2eb;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1815">
<div style="max-width:440px;margin:0 auto">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:-0.01em;margin-bottom:28px"><span style="color:#c2391b">${name.slice(0, 1)}</span>${name.slice(1)}</div>
${lines.map(line => `<p style="font-size:15px;line-height:1.55;margin:0 0 14px">${line}</p>`).join('')}
<a href="${escapeHtml(action.url)}" style="display:inline-block;margin-top:10px;background:#1a1815;color:#f5f2eb;text-decoration:none;font-size:14px;font-weight:500;padding:11px 20px;border-radius:999px">${escapeHtml(action.label)}</a>
</div></body></html>`
}

export async function sendEmail({
	name,
	to,
	subject,
	lines,
	action
}: {
	name: string
	to: string
	subject: string
	lines: string[]
	action: { label: string; url: string }
}) {
	if (process.env.NODE_ENV !== 'production') console.log(`[email] ${to} · ${subject} · ${action.url}`)
	const { error } = await resend.emails.send({
		from: `${name} <hello@mmxxv.bet>`,
		to,
		subject,
		html: page({ name, lines, action }),
		text: `${lines.join('\n\n').replace(/<[^>]+>/g, '')}\n\n${action.label}: ${action.url}`
	})
	if (error) console.error(`[email] ${to} · ${error.message}`)
	return !error
}

export { escapeHtml }
