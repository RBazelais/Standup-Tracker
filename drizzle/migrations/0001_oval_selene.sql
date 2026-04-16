CREATE TABLE "external_task_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"source" text NOT NULL,
	"external_url" text,
	"title" text,
	"description" text,
	"status" text,
	"story_points" integer,
	"priority" text,
	"sprint_external_id" text,
	"raw_data" jsonb,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_task_cache_id_source_unique" UNIQUE("external_id","source")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"access_token" text NOT NULL,
	"account_name" text,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_user_source_unique" UNIQUE("user_id","source")
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_date" text,
	"status" text DEFAULT 'active' NOT NULL,
	"total_points" integer,
	"completed_points" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"milestone_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"target_points" integer,
	"completed_points" integer,
	"completed_at" timestamp,
	"external_id" text,
	"external_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standup_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standup_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"snapshot_sprint_id" uuid,
	"snapshot_status" text,
	"linked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_external_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"source" text NOT NULL,
	"external_url" text,
	"confidence" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_external_links_id_source_unique" UNIQUE("external_id","source")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sprint_id" uuid,
	"current_sprint_id" uuid,
	"first_sprint_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'none' NOT NULL,
	"story_points" integer,
	"story_point_system" text,
	"rollover_count" integer DEFAULT 0 NOT NULL,
	"total_sprints_touched" integer DEFAULT 0 NOT NULL,
	"external_id" text,
	"external_source" text,
	"external_url" text,
	"external_data" jsonb,
	"target_date" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "goals" CASCADE;--> statement-breakpoint
ALTER TABLE "standups" ADD COLUMN "work_completed" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "standups" ADD COLUMN "work_planned" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "standups" ADD COLUMN "task_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "standups" ADD COLUMN "snapshot_sprint_id" uuid;--> statement-breakpoint
ALTER TABLE "standups" ADD COLUMN "snapshot_milestone_id" uuid;--> statement-breakpoint
UPDATE "standups" SET "work_completed" = "yesterday", "work_planned" = "today";--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standup_tasks" ADD CONSTRAINT "standup_tasks_standup_id_standups_id_fk" FOREIGN KEY ("standup_id") REFERENCES "public"."standups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standup_tasks" ADD CONSTRAINT "standup_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_external_links" ADD CONSTRAINT "task_external_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_current_sprint_id_sprints_id_fk" FOREIGN KEY ("current_sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standups" DROP COLUMN "yesterday";--> statement-breakpoint
ALTER TABLE "standups" DROP COLUMN "today";--> statement-breakpoint
ALTER TABLE "standups" DROP COLUMN "goal_ids";