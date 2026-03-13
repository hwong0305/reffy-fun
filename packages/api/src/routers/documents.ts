import {
	auditEvent,
	db,
	document,
	documentAccessGrant,
	recommendationRequest,
	storedBlob,
} from "@reffy-fun/db";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import { createStorageProvider } from "../storage";

const storageProvider = createStorageProvider();

export const documentsRouter = router({
	createUploadTarget: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				mimeType: z.string().min(1),
				sizeBytes: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }) => {
			return storageProvider.createUploadTarget(input);
		}),
	uploadBytes: protectedProcedure
		.input(
			z.object({
				storageKey: z.string().min(1),
				bytesBase64: z.string().min(1),
			}),
		)
		.mutation(async ({ input }) => {
			const bytes = Buffer.from(input.bytesBase64, "base64");
			await storageProvider.uploadBytes({
				storageKey: input.storageKey,
				bytes,
			});

			return { ok: true };
		}),
	finalizeUpload: protectedProcedure
		.input(
			z.object({
				storageKey: z.string().min(1),
				fileName: z.string().min(1),
				mimeType: z.string().min(1),
				sizeBytes: z.number().int().positive(),
				type: z.enum(["recommendation", "transcript", "resume"]),
				ownerUserId: z.string().min(1).optional(),
				writerUserId: z.string().min(1).optional(),
				note: z.string().optional(),
				checksum: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await storageProvider.finalizeUpload({
				storageKey: input.storageKey,
				checksum: input.checksum,
			});

			const id = crypto.randomUUID();
			const now = new Date();
			const ownerUserId = input.ownerUserId ?? ctx.session.user.id;

			await db.insert(document).values({
				id,
				ownerUserId,
				uploaderUserId: ctx.session.user.id,
				type: input.type,
				storageProvider: storageProvider.kind,
				storageKey: input.storageKey,
				fileName: input.fileName,
				mimeType: input.mimeType,
				sizeBytes: input.sizeBytes,
				checksum: input.checksum,
				status: "ready",
				createdAt: now,
				updatedAt: now,
			});

			if (input.type === "recommendation") {
				if (!input.writerUserId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "writerUserId is required for recommendation letters",
					});
				}

				await db.insert(recommendationRequest).values({
					id: crypto.randomUUID(),
					documentId: id,
					subjectUserId: ownerUserId,
					writerUserId: input.writerUserId,
					requestStatus: "submitted",
					note: input.note,
					createdAt: now,
					updatedAt: now,
				});
			}

			await db.insert(auditEvent).values({
				id: crypto.randomUUID(),
				actorUserId: ctx.session.user.id,
				entityType: "document",
				entityId: id,
				eventType: "document.upload.finalized",
				payloadJson: JSON.stringify({
					type: input.type,
					ownerUserId,
				}),
				createdAt: now,
			});

			return { id };
		}),
	listOwnedDocuments: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db.query.document.findMany({
			where: (table, { eq }) => eq(table.ownerUserId, ctx.session.user.id),
			orderBy: (table, { desc }) => [desc(table.createdAt)],
		});

		return rows;
	}),
	listInboxDocuments: protectedProcedure.query(async ({ ctx }) => {
		const rows = await db
			.select({
				document,
				grant: documentAccessGrant,
			})
			.from(documentAccessGrant)
			.innerJoin(document, eq(document.id, documentAccessGrant.documentId))
			.where(
				and(
					eq(documentAccessGrant.granteeUserId, ctx.session.user.id),
					isNull(documentAccessGrant.revokedAt),
				),
			);

		return rows.map((row) => ({
			...row.document,
			canDownload: row.grant.canDownload,
		}));
	}),
	getDownloadTarget: protectedProcedure
		.input(z.object({ documentId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const doc = await db.query.document.findFirst({
				where: (table, { eq }) => eq(table.id, input.documentId),
			});

			if (!doc) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Document not found",
				});
			}

			const grant = await db.query.documentAccessGrant.findFirst({
				where: (table, { and, eq, isNull }) =>
					and(
						eq(table.documentId, doc.id),
						eq(table.granteeUserId, ctx.session.user.id),
						isNull(table.revokedAt),
					),
			});

			const isOwner = doc.ownerUserId === ctx.session.user.id;
			if (!isOwner && !grant) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized to access this document",
				});
			}

			const target = await storageProvider.createDownloadTarget({
				storageKey: doc.storageKey,
			});
			const bytes = await storageProvider.readBytes(target.storageKey);

			return {
				documentId: doc.id,
				fileName: doc.fileName,
				mimeType: doc.mimeType,
				bytesBase64: Buffer.from(bytes).toString("base64"),
			};
		}),
	deleteOwnedDocument: protectedProcedure
		.input(z.object({ documentId: z.string().min(1) }))
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

			await db
				.update(document)
				.set({ status: "deleted", updatedAt: new Date() })
				.where(eq(document.id, doc.id));

			await db
				.delete(storedBlob)
				.where(eq(storedBlob.storageKey, doc.storageKey));

			await db.insert(auditEvent).values({
				id: crypto.randomUUID(),
				actorUserId: ctx.session.user.id,
				entityType: "document",
				entityId: doc.id,
				eventType: "document.deleted",
				createdAt: new Date(),
			});

			return { ok: true };
		}),
});
