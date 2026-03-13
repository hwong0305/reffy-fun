CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `audit_event` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_event_entity_idx` ON `audit_event` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_event_actor_user_id_idx` ON `audit_event` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `audit_event_event_type_idx` ON `audit_event` (`event_type`);--> statement-breakpoint
CREATE TABLE `document` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`uploader_user_id` text NOT NULL,
	`type` text NOT NULL,
	`storage_provider` text NOT NULL,
	`storage_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`checksum` text,
	`status` text DEFAULT 'uploading' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploader_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `document_owner_user_id_idx` ON `document` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `document_uploader_user_id_idx` ON `document` (`uploader_user_id`);--> statement-breakpoint
CREATE INDEX `document_type_idx` ON `document` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `document_storage_key_uidx` ON `document` (`storage_key`);--> statement-breakpoint
CREATE TABLE `document_access_grant` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`grantee_user_id` text NOT NULL,
	`granted_via_share_id` text,
	`can_download` integer DEFAULT true NOT NULL,
	`granted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`grantee_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`granted_via_share_id`) REFERENCES `recipient_share`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_access_grant_document_grantee_uidx` ON `document_access_grant` (`document_id`,`grantee_user_id`);--> statement-breakpoint
CREATE INDEX `document_access_grant_grantee_user_id_idx` ON `document_access_grant` (`grantee_user_id`);--> statement-breakpoint
CREATE TABLE `recipient_share` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`recipient_email` text NOT NULL,
	`recipient_user_id` text,
	`created_by_user_id` text NOT NULL,
	`share_status` text DEFAULT 'pending_writer_approval' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipient_share_document_id_idx` ON `recipient_share` (`document_id`);--> statement-breakpoint
CREATE INDEX `recipient_share_recipient_email_idx` ON `recipient_share` (`recipient_email`);--> statement-breakpoint
CREATE INDEX `recipient_share_recipient_user_id_idx` ON `recipient_share` (`recipient_user_id`);--> statement-breakpoint
CREATE INDEX `recipient_share_created_by_user_id_idx` ON `recipient_share` (`created_by_user_id`);--> statement-breakpoint
CREATE TABLE `recommendation_request` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`subject_user_id` text NOT NULL,
	`writer_user_id` text NOT NULL,
	`request_status` text DEFAULT 'pending' NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`writer_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendation_request_document_id_uidx` ON `recommendation_request` (`document_id`);--> statement-breakpoint
CREATE INDEX `recommendation_request_subject_user_id_idx` ON `recommendation_request` (`subject_user_id`);--> statement-breakpoint
CREATE INDEX `recommendation_request_writer_user_id_idx` ON `recommendation_request` (`writer_user_id`);--> statement-breakpoint
CREATE TABLE `stored_blob` (
	`storage_key` text PRIMARY KEY NOT NULL,
	`bytes` blob NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `stored_blob_created_at_idx` ON `stored_blob` (`created_at`);--> statement-breakpoint
CREATE TABLE `writer_approval` (
	`id` text PRIMARY KEY NOT NULL,
	`share_id` text NOT NULL,
	`writer_user_id` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text,
	`decided_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`share_id`) REFERENCES `recipient_share`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`writer_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `writer_approval_share_writer_uidx` ON `writer_approval` (`share_id`,`writer_user_id`);--> statement-breakpoint
CREATE INDEX `writer_approval_writer_user_id_idx` ON `writer_approval` (`writer_user_id`);