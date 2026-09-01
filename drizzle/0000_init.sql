CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`session_id` text NOT NULL,
	`answered_key` text NOT NULL,
	`correct` integer NOT NULL,
	`confidence` integer NOT NULL,
	`seconds` real NOT NULL,
	`error_class` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "attempts_confidence_check" CHECK("attempts"."confidence" >= 1 AND "attempts"."confidence" <= 5),
	CONSTRAINT "attempts_seconds_check" CHECK("attempts"."seconds" >= 0),
	CONSTRAINT "attempts_error_class_check" CHECK("attempts"."error_class" IS NULL OR "attempts"."error_class" IN ('content_gap', 'reasoning', 'misread', 'timing', 'trap', 'other')),
	CONSTRAINT "attempts_error_class_required_check" CHECK(("attempts"."correct" = 1 AND "attempts"."error_class" IS NULL) OR ("attempts"."correct" = 0 AND "attempts"."error_class" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `attempts_item_id_idx` ON `attempts` (`item_id`);--> statement-breakpoint
CREATE INDEX `attempts_session_id_idx` ON `attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `attempts_created_at_idx` ON `attempts` (`created_at`);--> statement-breakpoint
CREATE TABLE `concepts` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`exam` text NOT NULL,
	`level` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`exam_weight` real NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "concepts_exam_check" CHECK("concepts"."exam" IN ('mcat', 'gamsat')),
	CONSTRAINT "concepts_level_check" CHECK("concepts"."level" IN ('section', 'category', 'topic')),
	CONSTRAINT "concepts_weight_check" CHECK("concepts"."exam_weight" >= 0 AND "concepts"."exam_weight" <= 1)
);
--> statement-breakpoint
CREATE INDEX `concepts_parent_id_idx` ON `concepts` (`parent_id`);--> statement-breakpoint
CREATE INDEX `concepts_exam_idx` ON `concepts` (`exam`);--> statement-breakpoint
CREATE INDEX `concepts_level_idx` ON `concepts` (`level`);--> statement-breakpoint
CREATE TABLE `external_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`exam` text NOT NULL,
	`source_name` text NOT NULL,
	`section` text NOT NULL,
	`score` real NOT NULL,
	`percentile` real,
	`taken_at` text NOT NULL,
	`notes` text,
	CONSTRAINT "external_scores_exam_check" CHECK("external_scores"."exam" IN ('mcat', 'gamsat')),
	CONSTRAINT "external_scores_percentile_check" CHECK("external_scores"."percentile" IS NULL OR ("external_scores"."percentile" >= 0 AND "external_scores"."percentile" <= 100))
);
--> statement-breakpoint
CREATE INDEX `external_scores_taken_at_idx` ON `external_scores` (`taken_at`);--> statement-breakpoint
CREATE INDEX `external_scores_exam_idx` ON `external_scores` (`exam`);--> statement-breakpoint
CREATE TABLE `fsrs_state` (
	`item_id` text PRIMARY KEY NOT NULL,
	`stability` real NOT NULL,
	`difficulty` real NOT NULL,
	`due_at` text NOT NULL,
	`last_review_at` text,
	`reps` integer NOT NULL,
	`lapses` integer NOT NULL,
	`state` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "fsrs_state_state_check" CHECK("fsrs_state"."state" IN ('new', 'learning', 'review', 'relearning')),
	CONSTRAINT "fsrs_state_reps_check" CHECK("fsrs_state"."reps" >= 0),
	CONSTRAINT "fsrs_state_lapses_check" CHECK("fsrs_state"."lapses" >= 0)
);
--> statement-breakpoint
CREATE INDEX `fsrs_state_due_at_idx` ON `fsrs_state` (`due_at`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`passage_id` text,
	`concept_id` text NOT NULL,
	`skill_tag` text,
	`stem` text NOT NULL,
	`choices` text NOT NULL,
	`correct_key` text NOT NULL,
	`explanation` text NOT NULL,
	`distractor_rationales` text NOT NULL,
	`difficulty_est` real NOT NULL,
	`source` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`passage_id`) REFERENCES `passages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "items_type_check" CHECK("items"."type" IN ('discrete', 'passage_question')),
	CONSTRAINT "items_source_check" CHECK("items"."source" IN ('ai_generated', 'official_entry')),
	CONSTRAINT "items_difficulty_check" CHECK("items"."difficulty_est" >= 0 AND "items"."difficulty_est" <= 1),
	CONSTRAINT "items_passage_required_check" CHECK("items"."type" != 'passage_question' OR "items"."passage_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX `items_concept_id_idx` ON `items` (`concept_id`);--> statement-breakpoint
CREATE INDEX `items_passage_id_idx` ON `items` (`passage_id`);--> statement-breakpoint
CREATE INDEX `items_verified_idx` ON `items` (`verified`);--> statement-breakpoint
CREATE TABLE `passages` (
	`id` text PRIMARY KEY NOT NULL,
	`concept_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`item_count` integer NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `passages_concept_id_idx` ON `passages` (`concept_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`config` text DEFAULT '{}' NOT NULL,
	CONSTRAINT "sessions_kind_check" CHECK("sessions"."kind" IN ('daily', 'diagnostic', 'simulation'))
);
--> statement-breakpoint
CREATE INDEX `sessions_started_at_idx` ON `sessions` (`started_at`);