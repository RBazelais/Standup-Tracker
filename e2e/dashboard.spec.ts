import { test, expect } from "@playwright/test";

const STANDUP_ID = "d1a2b3c4-0000-4000-8000-000000000001";

const MOCK_STANDUP = {
	id: STANDUP_ID,
	date: "2026-04-16",
	workCompleted: "Shipped the task linking feature",
	workPlanned: "Write dashboard tests",
	blockers: "None",
	commits: [
		{
			sha: "abc1234",
			commit: {
				message: "feat: add task linking",
				author: { name: "testuser", date: "2026-04-16T10:00:00Z" },
			},
		},
	],
	repoFullName: "testuser/test-repo",
	linkedTasks: [],
};

const MOCK_TASK = {
	id: "task-1",
	title: "Fix authentication bug",
	status: "in_progress",
	externalId: "#42",
	externalSource: "github",
	externalLinks: [
		{
			externalId: "#42",
			externalUrl: "https://github.com/testuser/test-repo/issues/42",
		},
	],
};

const MOCK_AUTH = {
	state: {
		accessToken: "gho_fake_test_token",
		user: {
			id: 1,
			login: "testuser",
			name: "Test User",
			avatar_url: "https://github.com/identicons/testuser.png",
		},
		selectedRepo: {
			id: 123,
			name: "test-repo",
			full_name: "testuser/test-repo",
			private: false,
			default_branch: "main",
			owner: { login: "testuser" },
		},
		selectedBranch: "main",
		repos: [],
	},
	version: 0,
};

// Navigate to dashboard with auth set. page.goto creates a fresh JS context so
// React Query cache is empty — each test sees clean state.
async function navigateToDashboard(page: import("@playwright/test").Page) {
	await page.goto("/");
	await page.evaluate((auth) => {
		localStorage.setItem("standup-storage", JSON.stringify(auth));
	}, MOCK_AUTH);
	await page.goto("/dashboard");
}

test.describe("Dashboard - Standup History", () => {
	test.beforeEach(async ({ page }) => {
		// Mock external APIs that fire on every dashboard load
		await page.route("https://api.github.com/**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/milestones**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/tasks**", (route) =>
			route.fulfill({ json: { tasks: [], resolved: [], autoLinked: [] } })
		);
	});

	test("shows error state when the standups API returns a 500", async ({ page }) => {
		// This is the regression: getTableColumns missing caused exactly this response
		await page.route("**/api/standups**", (route) =>
			route.fulfill({
				status: 500,
				json: {
					error: "Failed to fetch standups",
					details: "getTableColumns is not defined",
				},
			})
		);

		await navigateToDashboard(page);

		// Wait for the section heading to confirm dashboard rendered with auth
		await expect(
			page.getByRole("heading", { name: /standup history/i })
		).toBeVisible();

		await expect(
			page.getByRole("heading", { name: /failed to load standups/i })
		).toBeVisible();
		await expect(
			page.getByText(/there was an error loading your standup history/i)
		).toBeVisible();
	});

	test("shows empty state when the API returns no standups", async ({ page }) => {
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [] })
		);

		await navigateToDashboard(page);

		await expect(
			page.getByRole("heading", { name: /standup history/i })
		).toBeVisible();

		await expect(
			page.getByRole("heading", { name: /no standup notes yet/i })
		).toBeVisible();
		await expect(
			page.getByText(/create your first standup note/i)
		).toBeVisible();
	});

	test("renders standup cards when the API returns data", async ({ page }) => {
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [MOCK_STANDUP] })
		);

		await navigateToDashboard(page);

		// History list heading confirms data mode rendered
		await expect(
			page.getByRole("heading", { name: /standup note history/i })
		).toBeVisible();

		// Card content
		await expect(page.getByText("Thursday, April 16, 2026")).toBeVisible();
		await expect(page.getByText("Shipped the task linking feature")).toBeVisible();
		await expect(page.getByText("Write dashboard tests")).toBeVisible();
		await expect(page.getByText("1 note")).toBeVisible();
	});

	test("shows blockers badge on standups that have blockers", async ({ page }) => {
		const standupWithBlockers = {
			...MOCK_STANDUP,
			blockers: "Waiting on design review",
		};

		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [standupWithBlockers] })
		);

		await navigateToDashboard(page);

		await expect(
			page.getByRole("heading", { name: /standup note history/i })
		).toBeVisible();

		await expect(page.locator("span").filter({ hasText: /^Blockers$/ })).toBeVisible();
	});

	test("renders linked task chips on standup cards", async ({ page }) => {
		const standupWithTask = {
			...MOCK_STANDUP,
			linkedTasks: [MOCK_TASK],
		};

		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [standupWithTask] })
		);

		await navigateToDashboard(page);

		await expect(
			page.getByRole("heading", { name: /standup note history/i })
		).toBeVisible();

		await expect(page.getByText("Fix authentication bug")).toBeVisible();
		await expect(page.getByText("#42")).toBeVisible();
	});

	test("clicking a standup card navigates to its detail view", async ({ page }) => {
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [MOCK_STANDUP] })
		);
		// Detail view fetch
		await page.route(`**/api/standups/${STANDUP_ID}`, (route) =>
			route.fulfill({ json: MOCK_STANDUP })
		);

		await navigateToDashboard(page);

		await expect(
			page.getByRole("heading", { name: /standup note history/i })
		).toBeVisible();

		await page
			.getByRole("listitem")
			.filter({ hasText: "Thursday, April 16, 2026" })
			.click();

		await page.waitForURL(`**/standup/${STANDUP_ID}`);
	});
});
