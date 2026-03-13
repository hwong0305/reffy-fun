import {
	auditEvent,
	db,
	document,
	documentAccessGrant,
	recipientShare,
	writerApproval,
} from "@reffy-fun/db";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
	canCreateShareForRecipient,
	canOwnerRevokeShare,
	canRecipientClaimShare,
	getInitialShareStatus,
	requiresWriterApproval,
	resolveShareTransition,
} from "../domain/share-state";
import { protectedProcedure, router } from "../index";

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

export const sharesRouter = router({
	createRecipientShare: protectedProcedure
		.input(
			z.object({
				documentId: z.string().min(1),
				recipientEmail: z.email(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const doc = await db.query.document.findFirst({
				where: (table, { and, eq }) =>
					and(
						eq(table.id, input.documentId),
						eq(table.ownerUserId, ctx.session.user.id),
					),
			});

			if (!doc) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			const recipientEmail = normalizeEmail(input.recipientEmail);
			const existingShares = await db.query.recipientShare.findMany({
				where: (table, { and, eq }) =>
					and(
						eq(table.documentId, doc.id),
						eq(table.recipientEmail, recipientEmail),
					),
			});

			if (
				!canCreateShareForRecipient(
					existingShares.map((share) => share.shareStatus),
				)
			) {
				throw new TRPCError({
					code: "CONFLICT",
					message:
						"An active share already exists for this document and recipient email",
				});
			}

			const existingUser = await db.query.user.findFirst({
				where: (table, { eq }) => eq(table.email, recipientEmail),
			});

			const shareId = crypto.randomUUID();
			const now = new Date();
			const initialStatus = getInitialShareStatus(doc.type);

			await db.insert(recipientShare).values({
				id: shareId,
				documentId: doc.id,
				recipientEmail,
				recipientUserId: existingUser?.id,
				createdByUserId: ctx.session.user.id,
				shareStatus: initialStatus,
				createdAt: now,
				updatedAt: now,
			});

			if (!requiresWriterApproval(doc.type) && existingUser) {
				const nextStatus = resolveShareTransition(
					initialStatus,
					"recipient_claim",
				);
				if (!nextStatus) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Invalid automatic claim transition",
					});
				}

				await db.insert(documentAccessGrant).values({
					id: crypto.randomUUID(),
					documentId: doc.id,
					granteeUserId: existingUser.id,
					grantedViaShareId: shareId,
					canDownload: true,
					grantedAt: now,
				});

				await db
					.update(recipientShare)
					.set({
						shareStatus: nextStatus,
						updatedAt: now,
					})
					.where(eq(recipientShare.id, shareId));
			}

			await db.insert(auditEvent).values({
				id: crypto.randomUUID(),
				actorUserId: ctx.session.user.id,
				entityType: "share",
				entityId: shareId,
				eventType: "share.created",
				payloadJson: JSON.stringify({
					documentId: doc.id,
					recipientEmail,
				}),
				createdAt: now,
			});

			return { id: shareId, shareStatus: initialStatus };
		}),
	listOutgoingShares: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				share: recipientShare,
				document,
			})
			.from(recipientShare)
			.innerJoin(document, eq(document.id, recipientShare.documentId))
			.where(eq(document.ownerUserId, ctx.session.user.id));

		return rows.map((row) => ({
			...row.share,
			document: row.document,
		}));
	}),
	listClaimableShares: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				share: recipientShare,
				document,
			})
			.from(recipientShare)
			.innerJoin(document, eq(document.id, recipientShare.documentId))
			.where(
				eq(
					recipientShare.recipientEmail,
					normalizeEmail(ctx.session.user.email),
				),
			);

		return rows.map((row) => ({
			...row.share,
			document: row.document,
		}));
	}),
	listRecipientShares: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				share: recipientShare,
				document,
				approval: writerApproval,
			})
			.from(recipientShare)
			.innerJoin(document, eq(document.id, recipientShare.documentId))
			.leftJoin(writerApproval, eq(writerApproval.shareId, recipientShare.id))
			.where(
				eq(
					recipientShare.recipientEmail,
					normalizeEmail(ctx.session.user.email),
				),
			);

		return rows.map((row) => ({
			...row.share,
			document: row.document,
			approval: row.approval,
		}));
	}),
	claimShareByEmail: protectedProcedure
		.input(z.object({ shareId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const share = await db.query.recipientShare.findFirst({
				where: (table, { eq }) => eq(table.id, input.shareId),
			});

			if (!share) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share not found",
				});
			}

			const sessionEmail = normalizeEmail(ctx.session.user.email);
			if (sessionEmail !== normalizeEmail(share.recipientEmail)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This share is tied to a different email address",
				});
			}

			if (
				share.recipientUserId &&
				share.recipientUserId !== ctx.session.user.id
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This share has already been claimed by another account",
				});
			}

			if (!canRecipientClaimShare(share.shareStatus)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This share is not claimable in its current state",
				});
			}

			const now = new Date();
			const nextStatus = resolveShareTransition(
				share.shareStatus,
				"recipient_claim",
			);

			if (!nextStatus) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid share transition for recipient claim",
				});
			}
			await db
				.update(recipientShare)
				.set({
					recipientUserId: ctx.session.user.id,
					updatedAt: now,
					shareStatus: nextStatus,
				})
				.where(eq(recipientShare.id, share.id));

			if (nextStatus === "claimed") {
				await db
					.insert(documentAccessGrant)
					.values({
						id: crypto.randomUUID(),
						documentId: share.documentId,
						granteeUserId: ctx.session.user.id,
						grantedViaShareId: share.id,
						canDownload: true,
						grantedAt: now,
					})
					.onConflictDoNothing();
			}

			await db.insert(auditEvent).values({
				id: crypto.randomUUID(),
				actorUserId: ctx.session.user.id,
				entityType: "share",
				entityId: share.id,
				eventType: "share.claimed",
				payloadJson: JSON.stringify({
					recipientUserId: ctx.session.user.id,
				}),
				createdAt: now,
			});

			return { ok: true };
		}),
	revokeShare: protectedProcedure
		.input(z.object({ shareId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const row = await db
				.select({
					share: recipientShare,
					doc: document,
				})
				.from(recipientShare)
				.innerJoin(document, eq(document.id, recipientShare.documentId))
				.where(eq(recipientShare.id, input.shareId))
				.limit(1);

			const result = row.at(0);
			if (!result) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Share not found",
				});
			}

			if (result.doc.ownerUserId !== ctx.session.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the document owner can revoke this share",
				});
			}

			if (!canOwnerRevokeShare(result.share.shareStatus)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Share is already revoked or rejected",
				});
			}

			const now = new Date();
			const nextStatus = resolveShareTransition(
				result.share.shareStatus,
				"owner_revoke",
			);

			if (!nextStatus) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid share transition for owner revocation",
				});
			}

			await db
				.update(recipientShare)
				.set({
					shareStatus: nextStatus,
					updatedAt: now,
				})
				.where(eq(recipientShare.id, result.share.id));

			await db
				.update(documentAccessGrant)
				.set({
					revokedAt: now,
				})
				.where(
					and(
						eq(documentAccessGrant.documentId, result.share.documentId),
						eq(documentAccessGrant.grantedViaShareId, result.share.id),
					),
				);

			await db.insert(auditEvent).values({
				id: crypto.randomUUID(),
				actorUserId: ctx.session.user.id,
				entityType: "share",
				entityId: result.share.id,
				eventType: "share.owner_revoked",
				payloadJson: JSON.stringify({
					documentId: result.share.documentId,
				}),
				createdAt: now,
			});

			return { ok: true };
		}),
});
