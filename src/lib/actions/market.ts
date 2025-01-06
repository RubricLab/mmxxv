'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '~/actions/auth'
import { db } from '~/db'

const MAX_MARKETS_PER_USER = 10

export async function createMarket(data: {
	title: string
	description: string
	resolutionCriteria: string
}) {
	const { user } = await getSession()

	// Check if user has reached market limit
	const marketCount = await db.market.count({
		where: {
			authorId: user.id
		}
	})

	if (marketCount >= MAX_MARKETS_PER_USER) {
		throw new Error(`You can only create up to ${MAX_MARKETS_PER_USER} markets`)
	}

	const market = await db.market.create({
		data: {
			...data,
			authorId: user.id
		}
	})

	revalidatePath('/markets')
	return market
}

export async function upvoteMarket(marketId: string) {
	const { user } = await getSession()

	const existingDownvote = await db.marketDownvotes.findUnique({
		where: {
			marketId_userId: {
				marketId,
				userId: user.id
			}
		}
	})

	if (existingDownvote) {
		await db.marketDownvotes.delete({
			where: {
				marketId_userId: {
					marketId,
					userId: user.id
				}
			}
		})
		await db.market.update({
			where: { id: marketId },
			data: {
				downvotes: { decrement: 1 }
			}
		})
	}

	const existingUpvote = await db.marketUpvotes.findUnique({
		where: {
			marketId_userId: {
				marketId,
				userId: user.id
			}
		}
	})

	if (existingUpvote) {
		await db.marketUpvotes.delete({
			where: {
				marketId_userId: {
					marketId,
					userId: user.id
				}
			}
		})
		await db.market.update({
			where: { id: marketId },
			data: {
				upvotes: { decrement: 1 }
			}
		})
	} else {
		await db.marketUpvotes.create({
			data: {
				marketId,
				userId: user.id
			}
		})
		await db.market.update({
			where: { id: marketId },
			data: {
				upvotes: { increment: 1 }
			}
		})
	}

	revalidatePath('/markets')
	revalidatePath(`/markets/${marketId}`)
}

export async function downvoteMarket(marketId: string) {
	const { user } = await getSession()

	const existingUpvote = await db.marketUpvotes.findUnique({
		where: {
			marketId_userId: {
				marketId,
				userId: user.id
			}
		}
	})

	if (existingUpvote) {
		await db.marketUpvotes.delete({
			where: {
				marketId_userId: {
					marketId,
					userId: user.id
				}
			}
		})
		await db.market.update({
			where: { id: marketId },
			data: {
				upvotes: { decrement: 1 }
			}
		})
	}

	const existingDownvote = await db.marketDownvotes.findUnique({
		where: {
			marketId_userId: {
				marketId,
				userId: user.id
			}
		}
	})

	if (existingDownvote) {
		await db.marketDownvotes.delete({
			where: {
				marketId_userId: {
					marketId,
					userId: user.id
				}
			}
		})
		await db.market.update({
			where: { id: marketId },
			data: {
				downvotes: { decrement: 1 }
			}
		})
	} else {
		await db.marketDownvotes.create({
			data: {
				marketId,
				userId: user.id
			}
		})
		await db.market.update({
			where: { id: marketId },
			data: {
				downvotes: { increment: 1 }
			}
		})
	}

	revalidatePath('/markets')
	revalidatePath(`/markets/${marketId}`)
}

export async function addComment(marketId: string, content: string, parentId?: string | null) {
	const { user } = await getSession()

	if (!content || typeof content !== 'string' || content.trim().length === 0) {
		throw new Error('Comment content must be a non-empty string')
	}

	await db.comment.create({
		data: {
			content: content.trim(),
			marketId,
			authorId: user.id,
			parentId: parentId || null
		}
	})

	revalidatePath('/markets')
	revalidatePath(`/markets/${marketId}`)
}

export async function getMarketById(marketId: string) {
	return await db.market.findUnique({
		where: { id: marketId },
		include: {
			upvoters: true,
			downvoters: true,
			comments: {
				include: {
					author: {
						select: {
							id: true,
							email: true
						}
					},
					replies: {
						include: {
							author: {
								select: {
									id: true,
									email: true
								}
							},
							replies: {
								include: {
									author: {
										select: {
											id: true,
											email: true
										}
									}
								}
							}
						}
					}
				},
				orderBy: {
					createdAt: 'desc'
				}
			},
			author: {
				select: {
					id: true,
					email: true
				}
			}
		}
	})
}

export async function deleteMarket(marketId: string) {
	const { user } = await getSession()

	// Check if market exists and user is the author
	const market = await db.market.findUnique({
		where: { id: marketId },
		select: { authorId: true }
	})

	if (!market) {
		throw new Error('Market not found')
	}

	if (market.authorId !== user.id) {
		throw new Error('Unauthorized')
	}

	// Delete the market and all related records
	await db.market.delete({
		where: { id: marketId }
	})

	revalidatePath('/markets')
	revalidatePath(`/markets/${marketId}`)
}
