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

const STANDUP_WITH_TASKS_ID = "f1a2b3c4-0000-4000-8000-000000000002";

const MOCK_STANDUP_WITH_TASKS = {
	id: STANDUP_WITH_TASKS_ID,
	date: "2026-04-16",
	workCompleted: "Fixed the auth bug",
	workPlanned: "Add sprint picker",
	blockers: "None",
	commits: [
		{
			sha: "def5678",
			commit: {
				message: "fix: correct auth redirect",
				author: { name: "testuser", date: "2026-04-16T11:00:00Z" },
			},
		},
	],
	repoFullName: "testuser/test-repo",
	linkedTasks: [
		{
			id: "task-1",
			title: "Auth redirect bug",
			description: "",
			status: "done",
			externalLinks: [
				{
					externalId: "#42",
					source: "github",
					externalUrl: "https://github.com/testuser/test-repo/issues/42",
					confidence: "explicit",
				},
			],
			createdAt: new Date().toISOString(),
		},
		{
			id: "task-2",
			title: "Sprint picker UI",
			description: "",
			status: "in_progress",
			externalLinks: [
				{
					externalId: "#48",
					source: "github",
					externalUrl: "https://github.com/testuser/test-repo/issues/48",
					confidence: "explicit",
				},
			],
			createdAt: new Date().toISOString(),
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
		await expect(page.getByText(/copied as plain text/i)).toBeVisible();

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
		await expect(page.getByText(/copied as slack/i)).toBeVisible();

		const clipboard = await page.evaluate(() =>
			navigator.clipboard.readText()
		);

		expect(clipboard).toContain("*Standup -");
		expect(clipboard).toContain("✅ *Completed*");
	});

	test("copies Jira-formatted content to the clipboard", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /jira/i }).click();
		await expect(page.getByText(/copied as jira/i)).toBeVisible();

		const clipboard = await page.evaluate(() =>
			navigator.clipboard.readText()
		);

		expect(clipboard).toContain("h2. Standup -");
		expect(clipboard).toContain("*Completed*");
	});

	test("copies Markdown-formatted content to the clipboard", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /markdown/i }).click();
		await expect(page.getByText(/copied as markdown/i)).toBeVisible();

		const clipboard = await page.evaluate(() =>
			navigator.clipboard.readText()
		);

		expect(clipboard).toContain("## Standup -");
		expect(clipboard).toContain("### ✅ Completed");
	});

	test("includes commit SHAs in plain text clipboard output", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /plain text/i }).click();
		await expect(page.getByText(/copied as plain text/i)).toBeVisible();

		const clipboard = await page.evaluate(() => navigator.clipboard.readText());

		expect(clipboard).toContain("Commits:");
		expect(clipboard).toContain("abc1234: feat: add export formatters");
	});

	test("shows a fallback dialog when clipboard write fails", async ({ page }) => {
		await page.evaluate(() => {
			navigator.clipboard.writeText = () =>
				Promise.reject(new Error("Not allowed"));
		});

		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /plain text/i }).click();

		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByRole("textbox")).toBeVisible();
		const content = await page.getByRole("textbox").inputValue();
		expect(content).toContain("Standup -");
		expect(content).toContain("Built the export formatters");
	});
});

test.describe("Export - Copy Dropdown (with linked tasks)", () => {
	test.beforeEach(async ({ page, context }) => {
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);

		await page.route("https://api.github.com/**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [MOCK_STANDUP_WITH_TASKS] })
		);
		await page.route(`**/api/standups/${STANDUP_WITH_TASKS_ID}`, (route) =>
			route.fulfill({ json: MOCK_STANDUP_WITH_TASKS })
		);
		
		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);
		await page.goto(`/standup/${STANDUP_WITH_TASKS_ID}`);

		await expect(
			page.getByRole("button", { name: /edit standup note/i })
		).toBeVisible();
	});

	test("includes linked issue IDs in plain text clipboard output", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /plain text/i }).click();
		await expect(page.getByText(/copied as plain text/i)).toBeVisible();

		const clipboard = await page.evaluate(() => navigator.clipboard.readText());

		expect(clipboard).toContain("Linked Issues: #42, #48");
	});

	test("includes Slack-formatted issue links in clipboard output", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /slack/i }).click();
		await expect(page.getByText(/copied as slack/i)).toBeVisible();

		const clipboard = await page.evaluate(() => navigator.clipboard.readText());

		expect(clipboard).toContain(
			"<https://github.com/testuser/test-repo/issues/42|#42>"
		);
	});

	test("includes Markdown-formatted issue links in clipboard output", async ({ page }) => {
		await page.getByRole("button", { name: /copy/i }).click();
		await page.getByRole("menuitem", { name: /markdown/i }).click();
		await expect(page.getByText(/copied as markdown/i)).toBeVisible();

		const clipboard = await page.evaluate(() => navigator.clipboard.readText());

		expect(clipboard).toContain(
			"[#42](https://github.com/testuser/test-repo/issues/42)"
		);
	});
});
