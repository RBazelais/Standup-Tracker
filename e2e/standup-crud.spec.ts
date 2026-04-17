import { test, expect } from "@playwright/test";

const STANDUP_ID = "e5f6a7b8-0000-4000-8000-000000000001";

const MOCK_STANDUP = {
	id: STANDUP_ID,
	date: "2026-04-16",
	workCompleted: "Reviewed PRs and fixed deployment pipeline",
	workPlanned: "Start on authentication refactor",
	blockers: "None",
	commits: [
		{
			sha: "abc1234",
			commit: {
				message: "fix: deployment pipeline",
				author: { name: "testuser", date: "2026-04-16T10:00:00Z" },
			},
		},
	],
	repoFullName: "testuser/test-repo",
	linkedTasks: [],
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

test.describe("Standup CRUD", () => {
	test.beforeEach(async ({ page }) => {
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

	test("creates a standup and shows it in the history list", async ({ page }) => {
		const NEW_STANDUP = {
			...MOCK_STANDUP,
			id: "new-standup-id",
			workCompleted: "Built the CRUD test suite",
			workPlanned: "Deploy to staging",
			blockers: "None",
		};

		let created = false;
		// Broad pattern first — specific handler wins via LIFO, but there's no
		// specific route here so this handler covers both GET list and POST create.
		await page.route("**/api/standups**", async (route) => {
			if (route.request().method() === "POST") {
				created = true;
				return route.fulfill({ json: NEW_STANDUP });
			}
			// GET list — return the new standup once it's been created
			return route.fulfill({ json: created ? [NEW_STANDUP] : [] });
		});

		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);
		await page.goto("/dashboard");

		await expect(
			page.getByRole("button", { name: /save standup note/i })
		).toBeVisible();

		await page.getByLabel("Completed").fill("Built the CRUD test suite");
		await page.getByLabel("Planned").fill("Deploy to staging");

		await page.getByRole("button", { name: /save standup note/i }).click();

		await expect(page.getByText("Standup created!")).toBeVisible();

		// After React Query invalidates and refetches, the new standup appears in history
		await expect(
			page.getByRole("list", { name: /standup notes/i })
				.getByText("Built the CRUD test suite")
		).toBeVisible();
	});

	test("edits an existing standup and shows updated content on the detail view", async ({ page }) => {
		const UPDATED_STANDUP = {
			...MOCK_STANDUP,
			blockers: "Waiting on design review",
		};

		let saved = false;
		// Broad first, specific last — specific handler wins for getById and PUT
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [MOCK_STANDUP] })
		);
		await page.route(`**/api/standups/${STANDUP_ID}`, async (route) => {
			if (route.request().method() === "PUT") {
				saved = true;
				return route.fulfill({ json: UPDATED_STANDUP });
			}
			return route.fulfill({ json: saved ? UPDATED_STANDUP : MOCK_STANDUP });
		});

		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);
		await page.goto(`/standup/${STANDUP_ID}`);

		// Detail view loaded
		await expect(
			page.getByRole("button", { name: /edit standup note/i })
		).toBeVisible();

		await page.getByRole("button", { name: /edit standup note/i }).click();
		await page.waitForURL(`**/standup/${STANDUP_ID}/edit`);

		// Clear blockers and type new value
		const blockersField = page.getByPlaceholder("Any blockers?");
		await blockersField.clear();
		await blockersField.fill("Waiting on design review");

		await page.getByRole("button", { name: /save changes/i }).click();

		await expect(page.getByText("Standup updated!")).toBeVisible();
		await page.waitForURL(`**/standup/${STANDUP_ID}`);

		// Updated blockers should be visible in the detail view
		await expect(page.getByText("Waiting on design review")).toBeVisible();
	});

	test("deletes a standup and returns to the dashboard", async ({ page }) => {
		// Broad first, specific last
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route(`**/api/standups/${STANDUP_ID}`, async (route) => {
			if (route.request().method() === "DELETE") {
				return route.fulfill({ status: 200, body: "" });
			}
			return route.fulfill({ json: MOCK_STANDUP });
		});

		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);
		await page.goto(`/standup/${STANDUP_ID}`);

		// Detail view loaded — open delete dialog
		await expect(
			page.getByRole("button", { name: /delete/i })
		).toBeVisible();
		await page.getByRole("button", { name: /delete/i }).click();

		await expect(page.getByRole("alertdialog")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /delete standup note/i })
		).toBeVisible();

		// Confirm deletion inside the dialog
		await page.getByRole("alertdialog")
			.getByRole("button", { name: /^delete$/i })
			.click();

		await expect(page.getByText("Standup deleted!")).toBeVisible();
		await page.waitForURL("**/dashboard");
	});
});
