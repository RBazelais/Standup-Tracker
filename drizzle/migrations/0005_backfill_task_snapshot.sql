-- Backfill task_snapshot for standup_tasks rows created before migration 0004.
-- Those rows have a live task_id but no snapshot, so if the task is deleted later
-- there is nothing to render. Populate from current task state as a baseline.
-- Rows where task_id is already NULL (task was deleted pre-migration) are skipped;
-- those standup history entries were already lost under the old CASCADE behaviour.
UPDATE standup_tasks st
SET task_snapshot = jsonb_build_object(
    'title',          t.title,
    'status',         t.status,
    'externalId',     t.external_id,
    'externalUrl',    t.external_url,
    'externalSource', t.external_source
)
FROM tasks t
WHERE t.id = st.task_id
  AND st.task_snapshot IS NULL;
