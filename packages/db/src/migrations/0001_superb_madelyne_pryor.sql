CREATE TABLE `legal_acceptance` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`terms_version` text NOT NULL,
	`privacy_version` text NOT NULL,
	`accepted_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legal_acceptance_user_id_uidx` ON `legal_acceptance` (`user_id`);--> statement-breakpoint
CREATE INDEX `legal_acceptance_terms_version_idx` ON `legal_acceptance` (`terms_version`);--> statement-breakpoint
CREATE INDEX `legal_acceptance_privacy_version_idx` ON `legal_acceptance` (`privacy_version`);