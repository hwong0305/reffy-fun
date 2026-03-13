import { sql } from "drizzle-orm";
import {
	blob,
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const document = sqliteTable(
	"document",
	{
		id: text("id").primaryKey(),
		ownerUserId: text("owner_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		uploaderUserId: text("uploader_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type", {
			enum: ["recommendation", "transcript", "resume"],
		}).notNull(),
		storageProvider: text("storage_provider").notNull(),
		storageKey: text("storage_key").notNull(),
		fileName: text("file_name").notNull(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		checksum: text("checksum"),
		status: text("status", { enum: ["uploading", "ready", "deleted"] })
			.notNull()
			.default("uploading"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("document_owner_user_id_idx").on(table.ownerUserId),
		index("document_uploader_user_id_idx").on(table.uploaderUserId),
		index("document_type_idx").on(table.type),
		uniqueIndex("document_storage_key_uidx").on(table.storageKey),
	],
);

export const recommendationRequest = sqliteTable(
	"recommendation_request",
	{
		id: text("id").primaryKey(),
		documentId: text("document_id")
			.notNull()
			.references(() => document.id, { onDelete: "cascade" }),
		subjectUserId: text("subject_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		writerUserId: text("writer_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		requestStatus: text("request_status", {
			enum: ["pending", "submitted", "withdrawn"],
		})
			.notNull()
			.default("pending"),
		note: text("note"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("recommendation_request_document_id_uidx").on(table.documentId),
		index("recommendation_request_subject_user_id_idx").on(table.subjectUserId),
		index("recommendation_request_writer_user_id_idx").on(table.writerUserId),
	],
);

export const recipientShare = sqliteTable(
	"recipient_share",
	{
		id: text("id").primaryKey(),
		documentId: text("document_id")
			.notNull()
			.references(() => document.id, { onDelete: "cascade" }),
		recipientEmail: text("recipient_email").notNull(),
		recipientUserId: text("recipient_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		createdByUserId: text("created_by_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		shareStatus: text("share_status", {
			enum: ["pending_writer_approval", "approved", "rejected", "claimed"],
		})
			.notNull()
			.default("pending_writer_approval"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		index("recipient_share_document_id_idx").on(table.documentId),
		index("recipient_share_recipient_email_idx").on(table.recipientEmail),
		index("recipient_share_recipient_user_id_idx").on(table.recipientUserId),
		index("recipient_share_created_by_user_id_idx").on(table.createdByUserId),
	],
);

export const writerApproval = sqliteTable(
	"writer_approval",
	{
		id: text("id").primaryKey(),
		shareId: text("share_id")
			.notNull()
			.references(() => recipientShare.id, { onDelete: "cascade" }),
		writerUserId: text("writer_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		decision: text("decision", { enum: ["approved", "rejected"] }).notNull(),
		reason: text("reason"),
		decidedAt: integer("decided_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [
		uniqueIndex("writer_approval_share_writer_uidx").on(
			table.shareId,
			table.writerUserId,
		),
		index("writer_approval_writer_user_id_idx").on(table.writerUserId),
	],
);

export const documentAccessGrant = sqliteTable(
	"document_access_grant",
	{
		id: text("id").primaryKey(),
		documentId: text("document_id")
			.notNull()
			.references(() => document.id, { onDelete: "cascade" }),
		granteeUserId: text("grantee_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		grantedViaShareId: text("granted_via_share_id").references(
			() => recipientShare.id,
			{
				onDelete: "set null",
			},
		),
		canDownload: integer("can_download", { mode: "boolean" })
			.notNull()
			.default(true),
		grantedAt: integer("granted_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		uniqueIndex("document_access_grant_document_grantee_uidx").on(
			table.documentId,
			table.granteeUserId,
		),
		index("document_access_grant_grantee_user_id_idx").on(table.granteeUserId),
	],
);

export const auditEvent = sqliteTable(
	"audit_event",
	{
		id: text("id").primaryKey(),
		actorUserId: text("actor_user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		entityType: text("entity_type").notNull(),
		entityId: text("entity_id").notNull(),
		eventType: text("event_type").notNull(),
		payloadJson: text("payload_json"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [
		index("audit_event_entity_idx").on(table.entityType, table.entityId),
		index("audit_event_actor_user_id_idx").on(table.actorUserId),
		index("audit_event_event_type_idx").on(table.eventType),
	],
);

export const storedBlob = sqliteTable(
	"stored_blob",
	{
		storageKey: text("storage_key").primaryKey(),
		bytes: blob("bytes", { mode: "buffer" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
	},
	(table) => [index("stored_blob_created_at_idx").on(table.createdAt)],
);

export const legalAcceptance = sqliteTable(
	"legal_acceptance",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		termsVersion: text("terms_version").notNull(),
		privacyVersion: text("privacy_version").notNull(),
		acceptedAt: integer("accepted_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(now)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("legal_acceptance_user_id_uidx").on(table.userId),
		index("legal_acceptance_terms_version_idx").on(table.termsVersion),
		index("legal_acceptance_privacy_version_idx").on(table.privacyVersion),
	],
);
