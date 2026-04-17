import { test, expect } from "@playwright/test";

const STANDUP_ID = "f1a2b3c4-0000-4000-8000-000000000001";

const MOCK_STANDUP = {
	id: STANDUP_ID,
	date: "2026-04-16",
	workCompleted: "Built the export formatters",
	workPlanned: "Wire up the copy UI",
	blockers: "None",
	commits: [
		{
			sha: "abc1234",
			commit: {
				message: "feat: add export formatters",
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

test.describe("Export - Copy Dropdown", () => {
	test.beforeEach(async ({ page, context }) => {
		// Grant clipboard access so we can verify what gets copied
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);

		await page.route("https://api.github.com/**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [MOCK_STANDUP] })
		);
		await page.route(`**/api/standups/${STANDUP_ID}`, (route) =>
			route.fulfill({ json: MOCK_STANDUP })
		);

		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);
		await page.goto(`/standup/${STANDUP_ID}`);

		await expect(
			page.getByRole("button", { name: /edit standup note/i })
		).toBeVisible();
	});

	test("shows a Copy button in the action bar", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /copy/i })
		).toBeVisible();
	});

	test("opens a dropdown with all four format options", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();

		await expect(page.getByRole("menuitem", { name: /plain text/i })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: /slack/i })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: /jira/i })).toBeVisible();
		await expect(page.getByRole("menuitem", { name: /markdown/i })).toBeVisible();
	});

	test("closes the dropdown after selecting a format", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await expect(page.getByRole("menu")).toBeVisible();

		await page.getByRole("menuitem", { name: /plain text/i }).click();

		await expect(page.getByRole("menu")).not.toBeVisible();
	});

	test("shows a format-specific toast after copying", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /slack/i }).click();

		await expect(page.getByText(/copied as slack/i)).toBeVisible();
	});

	test("copies plain text content to the clipboard", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /plain text/i }).click();

		const clipboard = await page.evaluate(() =>
			navigator.clipboard.readText()
		);

		expect(clipboard).toContain("Standup -");
		expect(clipboard).toContain("Built the export formatters");
		expect(clipboard).toContain("Wire up the copy UI");
	});

	test("copies Slack-formatted content to the clipboard", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /slack/i }).click();

		const clipboard = await page.evaluate(() =>
			navigator.clipboard.readText()
		);

		expect(clipboard).toContain("*Standup -");
		expect(clipboard).toContain("✅ *Completed*");
	});
});
