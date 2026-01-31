# Schema Migration Guide

## Overview

This migration performs the following changes:

1. **Standup Field Renames:**
   - `yesterday` → `workCompleted` (date-agnostic terminology)
   - `today` → `workPlanned` (date-agnostic terminology)
   - Removes deprecated `goalIds` column

2. **Table Renames:**
   - `goals` → `milestones` (with new `status`, `totalPoints`, `completedPoints` columns)

3. **New Tables:**
   - `sprints` - Time-boxed work periods linked to milestones
   - `tasks` - Individual work items with story points

## Relationship Hierarchy

```
Milestone (long-term goal, e.g., "Ship MVP")
  └─ Sprint (time-boxed period, e.g., "Sprint 1: Jan 13-26")
      └─ Task (work item with story points)
          └─ Standup (daily note with commits linked via taskIds)
```

## Pre-Migration Checklist

- [ ] Backup your database (Neon provides point-in-time recovery)
- [ ] Ensure `.env.local` has valid `POSTGRES_URL`
- [ ] Stop any running development servers

## Migration Steps

### Step 1: Preview the Migration (Dry Run)

```bash
node migrate-schema.mjs --dry-run
```

This will show you:
- Current database state (tables and columns)
- All SQL statements that will be executed
- No actual changes will be made

### Step 2: Run the Migration

```bash
node migrate-schema.mjs
```

When prompted, type `yes` to confirm.

### Step 3: Verify the Migration

The script will automatically show the new database state after migration. Verify:
- `standups` table has `work_completed` and `work_planned` columns
- `milestones` table exists (renamed from `goals`)
- `sprints` table was created
- `tasks` table was created

### Step 4: Update Drizzle ORM

After the SQL migration, sync Drizzle's schema:

```bash
npm run db:push
```

This ensures Drizzle's metadata matches the actual database state.

### Step 5: Deploy to Production

```bash
vercel --prod
```

## Rollback Instructions

If something goes wrong, you can rollback:

```bash
node migrate-schema.mjs --rollback
```

This will:
- Drop `tasks` and `sprints` tables
- Rename `milestones` back to `goals`
- Restore `yesterday` and `today` columns in `standups`

**⚠️ Warning:** Rollback will delete any data created in the new tables!

## Updated API Endpoints

### Standups (updated field names)
- `GET /api/standups?userId=<id>` - List standups
- `POST /api/standups?userId=<id>` - Create standup
  ```json
  {
    "repoFullName": "owner/repo",
    "date": "2026-01-30",
    "workCompleted": "- Fixed bug ABC",
    "workPlanned": "- Work on feature XYZ",
    "blockers": "None",
    "commits": [],
    "taskIds": []
  }
  ```
- `GET /api/standups/<id>` - Get single standup
- `PUT /api/standups/<id>` - Update standup
- `DELETE /api/standups/<id>` - Delete standup

### Milestones (new)
- `GET /api/milestones?userId=<id>` - List milestones
- `POST /api/milestones?userId=<id>` - Create milestone
  ```json
  {
    "title": "Ship MVP to Production",
    "description": "Complete all Phase 1 features",
    "targetDate": "2026-02-15",
    "status": "active"
  }
  ```
- `GET /api/milestones/<id>` - Get single milestone
- `PUT /api/milestones/<id>` - Update milestone
- `DELETE /api/milestones/<id>` - Delete milestone

### Sprints (new)
- `GET /api/sprints?userId=<id>` - List sprints (optionally filter by `milestoneId`)
- `POST /api/sprints?userId=<id>` - Create sprint
  ```json
  {
    "milestoneId": "uuid-optional",
    "title": "Sprint 1: Auth & Database",
    "description": "Set up core infrastructure",
    "startDate": "2026-01-13",
    "endDate": "2026-01-26",
    "status": "planned",
    "targetPoints": 21
  }
  ```
- `GET /api/sprints/<id>` - Get single sprint
- `PUT /api/sprints/<id>` - Update sprint
- `DELETE /api/sprints/<id>` - Delete sprint

### Tasks (new)
- `GET /api/tasks?userId=<id>` - List tasks (optionally filter by `sprintId`, `status`)
- `POST /api/tasks?userId=<id>` - Create task
  ```json
  {
    "sprintId": "uuid-optional",
    "title": "Implement GitHub OAuth",
    "description": "Add login flow with GitHub",
    "status": "todo",
    "storyPoints": 5,
    "storyPointSystem": "fibonacci"
  }
  ```
- `GET /api/tasks/<id>` - Get single task
- `PUT /api/tasks/<id>` - Update task (auto-sets `completedAt` when status → `done`)
- `DELETE /api/tasks/<id>` - Delete task

## TypeScript Types

All new types are available in `src/types/index.ts`:

```typescript
import type { Standup, Milestone, Sprint, Task } from '../types';
```

## Store Methods

New Zustand store methods:

```typescript
const {
  // Existing
  standups, loadStandups, addStandup, updateStandup, deleteStandup,
  
  // Milestones
  milestones, loadMilestones, addMilestone, updateMilestone, deleteMilestone,
  
  // Sprints
  sprints, loadSprints, addSprint, updateSprint, deleteSprint,
  
  // Tasks
  tasks, loadTasks, addTask, updateTask, deleteTask,
} = useStore();
```

## Files Changed

### Schema & Database
- `drizzle/schema.ts` - Updated with all new table definitions
- `migrate-schema.mjs` - SQL migration script

### TypeScript Types
- `src/types/index.ts` - New Standup, Milestone, Sprint, Task interfaces

### API Routes
- `api/standups/index.ts` - Updated field names
- `api/standups/[id].ts` - Updated field names
- `api/milestones/index.ts` - NEW
- `api/milestones/[id].ts` - NEW
- `api/sprints/index.ts` - NEW
- `api/sprints/[id].ts` - NEW
- `api/tasks/index.ts` - NEW
- `api/tasks/[id].ts` - NEW

### Frontend Components
- `src/store/index.ts` - Updated with new methods
- `src/components/StandupForm.tsx` - Updated field names
- `src/components/StandupHistory.tsx` - Updated field names
- `src/components/StandupDetail.tsx` - Updated field names
- `src/components/StandupEdit.tsx` - Updated field names

## Troubleshooting

### "Column already exists" error
The migration uses `IF NOT EXISTS` and `IF EXISTS` clauses, so it's safe to re-run.

### "Table not found" error
Make sure you've run the initial database setup. Check if `standups` table exists.

### TypeScript errors after migration
Run `npm run dev` to regenerate types. If errors persist, restart your IDE.

### Data not showing after migration
Clear browser localStorage: `localStorage.removeItem('standup-storage')`

## Support

If you encounter issues, check:
1. Neon dashboard for database state
2. Vercel function logs for API errors
3. Browser console for frontend errors
