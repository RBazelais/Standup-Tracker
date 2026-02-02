/**
 * Schema Migration Script: Refactor Standups + Add Milestones/Sprints/Tasks
 *
 * This script performs the following migrations:
 * 1. Renames standup fields: yesterday → workCompleted, today → workPlanned
 * 2. Drops the goalIds column from standups (deprecated)
 * 3. Renames goals table → milestones and adds status column
 * 4. Creates sprints table with foreign key to milestones
 * 5. Creates tasks table with foreign key to sprints
 *
 * Usage:
 *   node migrate-schema.mjs           # Run migration
 *   node migrate-schema.mjs --dry-run # Preview SQL without executing
 *   node migrate-schema.mjs --rollback # Rollback the migration
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const { Pool } = pg;

const pool = new Pool({
	connectionString: process.env.POSTGRES_URL,
	ssl: { rejectUnauthorized: false },
});

const isDryRun = process.argv.includes("--dry-run");
const isRollback = process.argv.includes("--rollback");

// Forward migration SQL statements
const forwardMigrations = [
	// Step 1: Standups - Add new columns
	{
		name: "Add work_completed column to standups",
		sql: `ALTER TABLE standups ADD COLUMN IF NOT EXISTS work_completed TEXT;`,
	},
	{
		name: "Add work_planned column to standups",
		sql: `ALTER TABLE standups ADD COLUMN IF NOT EXISTS work_planned TEXT;`,
	},
	// Step 2: Copy data from old columns to new columns
	{
		name: "Copy yesterday → work_completed",
		sql: `UPDATE standups SET work_completed = yesterday WHERE work_completed IS NULL AND yesterday IS NOT NULL;`,
	},
	{
		name: "Copy today → work_planned",
		sql: `UPDATE standups SET work_planned = today WHERE work_planned IS NULL AND today IS NOT NULL;`,
	},
	// Step 3: Set default for any NULL values
	{
		name: "Set default for work_completed",
		sql: `UPDATE standups SET work_completed = '' WHERE work_completed IS NULL;`,
	},
	{
		name: "Set default for work_planned",
		sql: `UPDATE standups SET work_planned = '' WHERE work_planned IS NULL;`,
	},
	// Step 4: Make new columns NOT NULL
	{
		name: "Make work_completed NOT NULL",
		sql: `ALTER TABLE standups ALTER COLUMN work_completed SET NOT NULL;`,
	},
	{
		name: "Make work_planned NOT NULL",
		sql: `ALTER TABLE standups ALTER COLUMN work_planned SET NOT NULL;`,
	},
	// Step 5: Drop old columns (after data is migrated)
	{
		name: "Drop yesterday column",
		sql: `ALTER TABLE standups DROP COLUMN IF EXISTS yesterday;`,
	},
	{
		name: "Drop today column",
		sql: `ALTER TABLE standups DROP COLUMN IF EXISTS today;`,
	},
	{
		name: "Drop goal_ids column (deprecated)",
		sql: `ALTER TABLE standups DROP COLUMN IF EXISTS goal_ids;`,
	},

	// Step 6: Rename goals table to milestones
	{
		name: "Rename goals table to milestones",
		sql: `ALTER TABLE IF EXISTS goals RENAME TO milestones;`,
	},
	// Step 7: Add new columns to milestones
	{
		name: "Add status column to milestones",
		sql: `ALTER TABLE milestones ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';`,
	},
	{
		name: "Add total_points column to milestones",
		sql: `ALTER TABLE milestones ADD COLUMN IF NOT EXISTS total_points INTEGER;`,
	},
	{
		name: "Add completed_points column to milestones",
		sql: `ALTER TABLE milestones ADD COLUMN IF NOT EXISTS completed_points INTEGER;`,
	},

	// Step 8: Create sprints table
	{
		name: "Create sprints table",
		sql: `
			CREATE TABLE IF NOT EXISTS sprints (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id TEXT NOT NULL,
				milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				start_date TEXT NOT NULL,
				end_date TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'planned',
				target_points INTEGER,
				completed_points INTEGER,
				completed_at TIMESTAMP,
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
		`,
	},
	{
		name: "Create index on sprints.user_id",
		sql: `CREATE INDEX IF NOT EXISTS idx_sprints_user_id ON sprints(user_id);`,
	},
	{
		name: "Create index on sprints.milestone_id",
		sql: `CREATE INDEX IF NOT EXISTS idx_sprints_milestone_id ON sprints(milestone_id);`,
	},

	// Step 9: Create tasks table
	{
		name: "Create tasks table",
		sql: `
			CREATE TABLE IF NOT EXISTS tasks (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id TEXT NOT NULL,
				sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
				title TEXT NOT NULL,
				description TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'todo',
				story_points INTEGER,
				story_point_system TEXT,
				external_id TEXT,
				external_source TEXT,
				external_url TEXT,
				external_data JSONB,
				target_date TEXT,
				completed_at TIMESTAMP,
				created_at TIMESTAMP DEFAULT NOW() NOT NULL,
				updated_at TIMESTAMP DEFAULT NOW() NOT NULL
			);
		`,
	},
	{
		name: "Create index on tasks.user_id",
		sql: `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`,
	},
	{
		name: "Create index on tasks.sprint_id",
		sql: `CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);`,
	},
	{
		name: "Create index on tasks.status",
		sql: `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
	},
];

// Rollback migration SQL statements
const rollbackMigrations = [
	// Rollback Step 9: Drop tasks table
	{
		name: "Drop tasks indexes",
		sql: `
			DROP INDEX IF EXISTS idx_tasks_user_id;
			DROP INDEX IF EXISTS idx_tasks_sprint_id;
			DROP INDEX IF EXISTS idx_tasks_status;
		`,
	},
	{
		name: "Drop tasks table",
		sql: `DROP TABLE IF EXISTS tasks;`,
	},

	// Rollback Step 8: Drop sprints table
	{
		name: "Drop sprints indexes",
		sql: `
			DROP INDEX IF EXISTS idx_sprints_user_id;
			DROP INDEX IF EXISTS idx_sprints_milestone_id;
		`,
	},
	{
		name: "Drop sprints table",
		sql: `DROP TABLE IF EXISTS sprints;`,
	},

	// Rollback Step 7: Remove columns from milestones
	{
		name: "Drop completed_points from milestones",
		sql: `ALTER TABLE milestones DROP COLUMN IF EXISTS completed_points;`,
	},
	{
		name: "Drop total_points from milestones",
		sql: `ALTER TABLE milestones DROP COLUMN IF EXISTS total_points;`,
	},
	{
		name: "Drop status from milestones",
		sql: `ALTER TABLE milestones DROP COLUMN IF EXISTS status;`,
	},

	// Rollback Step 6: Rename milestones back to goals
	{
		name: "Rename milestones table back to goals",
		sql: `ALTER TABLE IF EXISTS milestones RENAME TO goals;`,
	},

	// Rollback Steps 1-5: Restore standup columns
	{
		name: "Add yesterday column back",
		sql: `ALTER TABLE standups ADD COLUMN IF NOT EXISTS yesterday TEXT;`,
	},
	{
		name: "Add today column back",
		sql: `ALTER TABLE standups ADD COLUMN IF NOT EXISTS today TEXT;`,
	},
	{
		name: "Add goal_ids column back",
		sql: `ALTER TABLE standups ADD COLUMN IF NOT EXISTS goal_ids JSONB NOT NULL DEFAULT '[]';`,
	},
	{
		name: "Copy work_completed → yesterday",
		sql: `UPDATE standups SET yesterday = work_completed WHERE yesterday IS NULL AND work_completed IS NOT NULL;`,
	},
	{
		name: "Copy work_planned → today",
		sql: `UPDATE standups SET today = work_planned WHERE today IS NULL AND work_planned IS NOT NULL;`,
	},
	{
		name: "Set default for yesterday",
		sql: `UPDATE standups SET yesterday = '' WHERE yesterday IS NULL;`,
	},
	{
		name: "Set default for today",
		sql: `UPDATE standups SET today = '' WHERE today IS NULL;`,
	},
	{
		name: "Make yesterday NOT NULL",
		sql: `ALTER TABLE standups ALTER COLUMN yesterday SET NOT NULL;`,
	},
	{
		name: "Make today NOT NULL",
		sql: `ALTER TABLE standups ALTER COLUMN today SET NOT NULL;`,
	},
	{
		name: "Drop work_completed column",
		sql: `ALTER TABLE standups DROP COLUMN IF EXISTS work_completed;`,
	},
	{
		name: "Drop work_planned column",
		sql: `ALTER TABLE standups DROP COLUMN IF EXISTS work_planned;`,
	},
];

async function runMigrations(migrations) {
	const client = await pool.connect();

	try {
		console.log("\n🚀 Starting migration...\n");

		for (const migration of migrations) {
			console.log(`📝 ${migration.name}`);

			if (isDryRun) {
				console.log(`   SQL: ${migration.sql.trim().replace(/\s+/g, " ").substring(0, 100)}...`);
			} else {
				try {
					await client.query(migration.sql);
					console.log(`   ✅ Success`);
				} catch (error) {
					console.error(`   ❌ Error: ${error.message}`);
					throw error;
				}
			}
		}

		console.log("\n✨ Migration completed successfully!\n");
	} catch (error) {
		console.error("\n❌ Migration failed:", error.message);
		console.log("\nTo rollback, run: node migrate-schema.mjs --rollback\n");
		process.exit(1);
	} finally {
		client.release();
	}
}

async function showCurrentState() {
	const client = await pool.connect();

	try {
		console.log("\n📊 Current Database State:\n");

		// Check standups columns
		const standupsResult = await client.query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'standups'
			ORDER BY ordinal_position;
		`);
		console.log("📋 Standups table columns:");
		standupsResult.rows.forEach((row) => {
			console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
		});

		// Check if goals/milestones exists
		const tablesResult = await client.query(`
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = 'public'
			AND table_name IN ('goals', 'milestones', 'sprints', 'tasks');
		`);
		console.log("\n📋 Related tables:");
		tablesResult.rows.forEach((row) => {
			console.log(`   - ${row.table_name}`);
		});

		// Count records
		const standupCount = await client.query(`SELECT COUNT(*) FROM standups;`);
		console.log(`\n📈 Record counts:`);
		console.log(`   - Standups: ${standupCount.rows[0].count}`);

		try {
			const goalsCount = await client.query(`SELECT COUNT(*) FROM goals;`);
			console.log(`   - Goals: ${goalsCount.rows[0].count}`);
		} catch {
			try {
				const milestonesCount = await client.query(`SELECT COUNT(*) FROM milestones;`);
				console.log(`   - Milestones: ${milestonesCount.rows[0].count}`);
			} catch {
				console.log(`   - Goals/Milestones: (table not found)`);
			}
		}

		try {
			const sprintsCount = await client.query(`SELECT COUNT(*) FROM sprints;`);
			console.log(`   - Sprints: ${sprintsCount.rows[0].count}`);
		} catch {
			console.log(`   - Sprints: (table not found)`);
		}

		try {
			const tasksCount = await client.query(`SELECT COUNT(*) FROM tasks;`);
			console.log(`   - Tasks: ${tasksCount.rows[0].count}`);
		} catch {
			console.log(`   - Tasks: (table not found)`);
		}

		console.log("");
	} finally {
		client.release();
	}
}

async function main() {
	console.log("=".repeat(60));
	console.log("📦 StandUp Tracker - Schema Migration Tool");
	console.log("=".repeat(60));

	if (!process.env.POSTGRES_URL) {
		console.error("\n❌ Error: POSTGRES_URL environment variable not set");
		console.log("Make sure you have a .env.local file with POSTGRES_URL defined.\n");
		process.exit(1);
	}

	await showCurrentState();

	if (isDryRun) {
		console.log("🔍 DRY RUN MODE - No changes will be made\n");
	}

	if (isRollback) {
		console.log("⚠️  ROLLBACK MODE - Reverting migration\n");
		console.log("This will:");
		console.log("  - Drop tasks table");
		console.log("  - Drop sprints table");
		console.log("  - Rename milestones back to goals");
		console.log("  - Restore yesterday/today columns in standups");
		console.log("");

		if (!isDryRun) {
			const readline = await import("readline");
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			const confirm = await new Promise((resolve) => {
				rl.question("Are you sure you want to rollback? (yes/no): ", (answer) => {
					rl.close();
					resolve(answer.toLowerCase() === "yes");
				});
			});

			if (!confirm) {
				console.log("\n❌ Rollback cancelled.\n");
				process.exit(0);
			}
		}

		await runMigrations(rollbackMigrations);
	} else {
		console.log("This will:");
		console.log("  - Rename standups.yesterday → work_completed");
		console.log("  - Rename standups.today → work_planned");
		console.log("  - Drop standups.goal_ids column");
		console.log("  - Rename goals table → milestones");
		console.log("  - Add status, total_points, completed_points to milestones");
		console.log("  - Create sprints table");
		console.log("  - Create tasks table");
		console.log("");

		if (!isDryRun) {
			const readline = await import("readline");
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});

			const confirm = await new Promise((resolve) => {
				rl.question("Continue with migration? (yes/no): ", (answer) => {
					rl.close();
					resolve(answer.toLowerCase() === "yes");
				});
			});

			if (!confirm) {
				console.log("\n❌ Migration cancelled.\n");
				process.exit(0);
			}
		}

		await runMigrations(forwardMigrations);
	}

	await showCurrentState();
	await pool.end();
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
