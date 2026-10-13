CREATE TABLE `natal_journal` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`mood` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_natal_journal_user_created` ON `natal_journal` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `natal_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`birth_data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_natal_profiles_user_updated` ON `natal_profiles` (`user_id`,`updated_at`);