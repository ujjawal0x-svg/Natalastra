CREATE TABLE `natal_studio` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_natal_studio_user_created` ON `natal_studio` (`user_id`,`created_at`);