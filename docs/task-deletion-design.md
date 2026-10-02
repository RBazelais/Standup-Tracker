# Task deletion and standup history

## The problem

The original schema used a cascading foreign key from `standup_tasks.task_id` to `tasks.id`. Deleting a task silently deleted every `standup_tasks` row that referenced it, which erased the historical record of which tasks were linked to past standups. No error, no tombstone — the link just disappeared.

## The fix (migrations 0004 and 0005)

Migration 0004 makes three changes:

1. `task_id` is now nullable, the row survives task deletion.
2. The FK is changed to `ON DELETE SET NULL` — when a task is deleted, Postgres nulls the `task_id` column instead of removing the row.
3. A `task_snapshot` jsonb column is added to preserve display data (title, status, external link) at the moment the task is linked.

Migration 0005 backfills `task_snapshot` for `standup_tasks` rows that existed before 0004 ran. Without this, any task deleted after 0004 but linked before it would render with no title. Rows where `task_id` was already NULL at backfill time (meaning the task was deleted while the old CASCADE was still active) are skipped — that history was gone before the fix landed.

## Snapshot timing is intentional

The snapshot is captured at link time (standup create or update), not at task delete time. If a task title changes between when the standup was saved and when the task is deleted, the snapshot reflects the title as of the last standup save.

This is deliberate: the snapshot is a historical record of what you were tracking at that moment, not a mirror of the task's final state. The tradeoff is that the displayed title can lag a rename. The alternative — re-snapshotting at delete time — would require a deletion hook and is not worth the complexity for a display-only field.

## Edit form behaviour

When a standup is edited, `StandupEdit` initialises the task picker with only live (non-deleted) tasks. Deleted tasks are filtered from the pre-selected list because they cannot be re-linked.

On save, `taskIds` in the PUT payload contains only live task IDs. The API handler deletes existing live-task rows (`WHERE task_id IS NOT NULL`) and reinserts from `taskIds`. The null-taskId row for the deleted task is untouched by that delete because the `IS NOT NULL` guard explicitly excludes it.

The result: editing a standup without touching task selection leaves the deleted-task link intact.
