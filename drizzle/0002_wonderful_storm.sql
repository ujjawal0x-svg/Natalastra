CREATE TABLE `natal_reflections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_key` text NOT NULL,
	`day` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_natal_reflections_user_created` ON `natal_reflections` (`user_id`,`created_at`);