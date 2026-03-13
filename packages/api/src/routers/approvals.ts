import {
	auditEvent,
	db,
	documentAccessGrant,
	recipientShare,
	recommendationRequest,
	writerApproval,
} from "@reffy-fun/db";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
	canWriterDecideShare,
	resolveShareTransition,
} from "../domain/share-state";
import { protectedProcedure, router } from "../index";

export const approvalsRouter = router({
	listPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				share: recipientShare,
				request: recommendationRequest,
			})
			.from(recipientShare)
			.innerJoin(
				recommendationRequest,
				eq(recommendationRequest.documentId, recipientShare.documentId),
			)
			.where(
				and(
					eq(recipientShare.shareStatus, "pending_writer_approval"),
					eq(recommendationRequest.writerUserId, ctx.session.user.id),
				),
			);

		return rows;
	}),
	decideShareApproval: protectedProcedure
		.input(
			z.object({
				shareId: z.string().min(1),
				decision: z.enum(["approved", "rejected"]),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const row = await db
				.select({
					share: recipientShare,
					request: recommendationRequest,
				})
				.from(recipientShare)
				.innerJoin(
					recommendationRequest,
					eq(recommendationRequest.documentId, recipientShare.documentId),
				)
				.where(eq(recipientShare.id, input.shareId))
				.limit(1);

			const result = row.at(0);
			if (!result) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share not found",
				});
			}

			if (result.request.writerUserId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the designated writer can approve this share",
				});
			}

			if (!canWriterDecideShare(result.share.shareStatus)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This share is not awaiting writer approval",
				});
			}

			const now = new Date();

			await db
				.insert(writerApproval)
				.values({
					id: crypto.randomUUID(),
					shareId: result.share.id,
					writerUserId: ctx.session.user.id,
					decision: input.decision,
					reason: input.reason,
					decidedAt: now,
					createdAt: now,
				})
				.onConflictDoUpdate({
					target: [writerApproval.shareId, writerApproval.writerUserId],
					set: {
						decision: input.decision,
						reason: input.reason,
						decidedAt: now,
					},
				});

			const nextStatus = resolveShareTransition(
				result.share.shareStatus,
				"writer_decision",
				{
					decision: input.decision,
					hasRecipientUserId: Boolean(result.share.recipientUserId),
				},
			);

			if (!nextStatus) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid share transition for writer decision",
				});
			}

			await db
				.update(recipientShare)
				.set({
					shareStatus: nextStatus,
					updatedAt: now,
				})
				.where(eq(recipientShare.id, result.share.id));

			if (nextStatus === "claimed" && result.share.recipientUserId) {
				await db
					.insert(documentAccessGrant)
					.values({
						id: crypto.randomUUID(),
						documentId: result.share.documentId,
						granteeUserId: result.share.recipientUserId,
						grantedViaShareId: result.share.id,
						canDownload: true,
						grantedAt: now,
					})
					.onConflictDoNothing();
			}

			await db.insert(auditEvent).values({
				id: crypto.randomUUID(),
				actorUserId: ctx.session.user.id,
				entityType: "share",
				entityId: result.share.id,
				eventType:
					input.decision === "approved"
						? "share.writer_approved"
						: "share.writer_rejected",
				payloadJson: JSON.stringify({
					decision: input.decision,
					reason: input.reason,
				}),
				createdAt: now,
			});

			return { ok: true };
		}),
});
