import Link from 'next/link'
import { CommentForm } from '~/components/comment-form'
import { ConfirmDelete } from '~/components/confirm-delete'
import { RichText } from '~/components/rich-text'
import { deleteComment } from '~/lib/actions'
import type { CommentNode } from '~/lib/data'
import { timeAgo } from '~/lib/time'

type Viewer = { id: string; admin: boolean } | null

function Comment({ node, marketId, viewer }: { node: CommentNode; marketId: string; viewer: Viewer }) {
	return (
		<div className="comment" id={node.id}>
			<div className="comment-head">
				<Link href={`/users/${node.author.id}`}>{node.author.username}</Link>
				<span className="meta">{timeAgo(node.createdAt)}</span>
			</div>
			<p className="comment-body prose">
				<RichText text={node.content} />
			</p>
			{viewer && (
				<div className="comment-actions">
					<CommentForm marketId={marketId} parentId={node.id} />
					{(viewer.id === node.author.id || viewer.admin) && (
						<ConfirmDelete action={deleteComment} id={node.id} label="Delete" />
					)}
				</div>
			)}
			{node.replies.length > 0 && (
				<div className="replies">
					{node.replies.map(reply => (
						<Comment key={reply.id} node={reply} marketId={marketId} viewer={viewer} />
					))}
				</div>
			)}
		</div>
	)
}

function count(nodes: CommentNode[]): number {
	return nodes.reduce((sum, node) => sum + 1 + count(node.replies), 0)
}

export function Comments({
	comments,
	marketId,
	viewer
}: {
	comments: CommentNode[]
	marketId: string
	viewer: Viewer
}) {
	const total = count(comments)
	return (
		<section className="section">
			<div className="section-head">
				<h2>Discussion</h2>
				{total > 0 && <span className="meta">{total}</span>}
			</div>
			<div className="comments">
				{comments.map(node => (
					<Comment key={node.id} node={node} marketId={marketId} viewer={viewer} />
				))}
			</div>
			{viewer ? (
				<div className="composer">
					<CommentForm marketId={marketId} parentId={null} />
				</div>
			) : (
				<p className="meta" style={{ marginTop: 24 }}>
					<Link href={`/auth/signin?next=/markets/${marketId}`}>Sign in</Link> to join the discussion.
				</p>
			)}
		</section>
	)
}
