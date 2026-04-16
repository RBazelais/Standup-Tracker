-- Migrate existing task_ids into the standup_tasks junction table before dropping the column.
-- Filters out temp-* IDs and any IDs that don't reference a real task row.
INSERT INTO standup_tasks (standup_id, task_id, linked_at)
SELECT
    s.id          AS standup_id,
    task_id::uuid AS task_id,
    s.created_at  AS linked_at
FROM standups s,
     LATERAL jsonb_array_elements_text(s.task_ids) AS task_id
WHERE s.task_ids != '[]'::jsonb
  AND task_id NOT LIKE 'temp-%'
  AND task_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id::uuid)
ON CONFLICT DO NOTHING;

-- Now safe to drop — all valid links have been moved to standup_tasks
ALTER TABLE "standups" DROP COLUMN "task_ids";
