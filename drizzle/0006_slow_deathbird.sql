CREATE TABLE `natal_diagnostics` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_diagnostics_created` ON `natal_diagnostics` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_diagnostics_session_created` ON `natal_diagnostics` (`session_id`,`created_at`);