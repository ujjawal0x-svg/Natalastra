CREATE TABLE `natal_account_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_key` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`first_attempt_at` text,
	`claimed_at` text,
	`accepted_at` text,
	`provider_id` text,
	`last_error` text,
	CONSTRAINT "account_email_kind" CHECK("natal_account_emails"."kind" IN ('welcome','welcome-back')),
	CONSTRAINT "account_email_status" CHECK("natal_account_emails"."status" IN ('pending','sending','accepted','failed'))
);
--> statement-breakpoint
CREATE INDEX `idx_account_emails_user` ON `natal_account_emails` (`user_id`);