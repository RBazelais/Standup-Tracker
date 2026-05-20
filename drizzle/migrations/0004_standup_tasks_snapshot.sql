-- Make task_id nullable so the row survives task deletion
ALTER TABLE "standup_tasks" ALTER COLUMN "task_id" DROP NOT NULL;

-- Add snapshot column to preserve display data at link time
ALTER TABLE "standup_tasks" ADD COLUMN "task_snapshot" jsonb;

-- Drop the cascading FK and replace with set null
ALTER TABLE "standup_tasks" DROP CONSTRAINT "standup_tasks_task_id_tasks_id_fk";
ALTER TABLE "standup_tasks" ADD CONSTRAINT "standup_tasks_task_id_tasks_id_fk"
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
