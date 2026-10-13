CREATE TABLE `natal_checkout_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product` text NOT NULL,
	`variant_id` text NOT NULL,
	`price` integer NOT NULL,
	`test_mode` integer NOT NULL,
	`created_at` text NOT NULL,
	`checkout_url` text,
	`order_id` text
);
--> statement-breakpoint
CREATE INDEX `idx_checkout_user_created` ON `natal_checkout_intents` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `natal_product_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`feature` text NOT NULL,
	`rating` text NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `natal_purchases` (
	`order_id` text PRIMARY KEY NOT NULL,
	`intent_id` text NOT NULL,
	`user_id` text NOT NULL,
	`product` text NOT NULL,
	`status` text NOT NULL,
	`test_mode` integer NOT NULL,
	`paid_at` text NOT NULL,
	`expires_at` text,
	`provider_updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_purchase_user` ON `natal_purchases` (`user_id`);--> statement-breakpoint
CREATE TABLE `natal_research_consent` (
	`user_id` text PRIMARY KEY NOT NULL,
	`enabled` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `natal_research_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event` text NOT NULL,
	`day` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_research_user_day` ON `natal_research_events` (`user_id`,`day`);