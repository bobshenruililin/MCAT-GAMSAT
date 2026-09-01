CREATE TABLE `mastery_priors` (
	`concept_id` text PRIMARY KEY NOT NULL,
	`value` real NOT NULL,
	`source` text NOT NULL,
	`session_id` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mastery_priors_value_check" CHECK("mastery_priors"."value" >= 0 AND "mastery_priors"."value" <= 1),
	CONSTRAINT "mastery_priors_source_check" CHECK("mastery_priors"."source" IN ('diagnostic'))
);
--> statement-breakpoint
CREATE INDEX `mastery_priors_session_id_idx` ON `mastery_priors` (`session_id`);