import { test, expect } from "@playwright/test";

const STANDUP_ID = "c7e3a1b2-0000-4000-8000-000000000001";

const MOCK_STANDUP = {
	id: STANDUP_ID,
	date: "2026-04-16",
	workCompleted: "Did some work",
	workPlanned: "Do more work",
	blockers: "None",
	commits: [
		{
			sha: "abc1234",
			commit: { message: "fix: something", author: { name: "testuser", date: "2026-04-16T10:00:00Z" } },
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

test.describe("Task Linking", () => {
	test.beforeEach(async ({ page }) => {
		// Mock external API calls — these need to match the full URL
		await page.route("https://api.github.com/**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/tasks**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/milestones**", (route) =>
			route.fulfill({ json: [] })
		);

		// Inject fake auth into localStorage before the app boots
		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);

		await page.goto("/dashboard");

		// Wait until the task linking section is visible (confirms StandupForm rendered)
		await expect(
			page.getByRole("button", { name: /link issue/i })
		).toBeVisible();
	});

	test("shows Linked Issues heading", async ({ page }) => {
		await expect(
			page.locator("h3").filter({ hasText: "Linked Issues" })
		).toBeVisible();
	});

	test("shows empty state when no issues are linked", async ({ page }) => {
		await expect(page.getByText("No linked issues yet")).toBeVisible();
	});

	test("shows Link Issue button", async ({ page }) => {
		await expect(
			page.getByRole("button", { name: /link issue/i })
		).toBeVisible();
	});

	test("opens issue picker dialog on Link Issue click", async ({ page }) => {
		await page.getByRole("button", { name: /link issue/i }).click();

		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /link github issue/i })
		).toBeVisible();
	});

	test("issue picker has a search input and search button", async ({ page }) => {
		await page.getByRole("button", { name: /link issue/i }).click();

		await expect(
			page.getByPlaceholder(/search issues by number or title/i)
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /^search$/i })
		).toBeVisible();
	});

	test("issue picker shows empty prompt before any search", async ({ page }) => {
		await page.getByRole("button", { name: /link issue/i }).click();

		await expect(
			page.getByText(/search for issues to link/i)
		).toBeVisible();
	});

	test("issue picker closes on Escape", async ({ page }) => {
		await page.getByRole("button", { name: /link issue/i }).click();
		await expect(page.getByRole("dialog")).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(page.getByRole("dialog")).not.toBeVisible();
	});

	test("typing in search input and clicking Search keeps dialog open", async ({
		page,
	}) => {
		await page.getByRole("button", { name: /link issue/i }).click();

		await page
			.getByPlaceholder(/search issues by number or title/i)
			.fill("auth bug");
		await page.getByRole("button", { name: /^search$/i }).click();

		// Dialog should stay open while search is in flight / after results arrive
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("removing a linked task clears it from the list", async ({ page }) => {
		const MOCK_TASK = {
			id: "task-1",
			title: "Fix authentication bug",
			status: "in_progress",
			externalId: "#42",
			externalSource: "github",
			externalLinks: [
				{
					externalId: "#42",
					externalUrl:
						"https://github.com/testuser/test-repo/issues/42",
				},
			],
		};

		await page.route("**/api/tasks**", async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === "search") {
				return route.fulfill({ json: { tasks: [MOCK_TASK] } });
			}
			if (body?.action === "resolve") {
				return route.fulfill({ json: { task: MOCK_TASK } });
			}
			return route.fulfill({ json: [] });
		});

		// Link the task first
		await page.getByRole("button", { name: /link issue/i }).click();
		await page.getByPlaceholder(/search issues by number or title/i).fill("auth");
		await page.getByRole("button", { name: /^search$/i }).click();
		await page.locator("button").filter({ hasText: "Fix authentication bug" }).click();
		await expect(page.getByRole("dialog")).not.toBeVisible();
		await expect(page.getByText("Fix authentication bug")).toBeVisible();

		// Hover the card to reveal the remove button, then remove
		await page.getByText("Fix authentication bug").hover();
		await page
			.getByRole("button", { name: /remove linked issue/i })
			.click();

		// Task should be gone, empty state should return
		await expect(page.getByText("Fix authentication bug")).not.toBeVisible();
		await expect(page.getByText("No linked issues yet")).toBeVisible();
	});

	test("pressing Enter in search input triggers search", async ({ page }) => {
		await page.route("**/api/tasks**", async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === "search") {
				return route.fulfill({
					json: {
						tasks: [
							{
								id: "task-2",
								title: "Update login flow",
								status: "planned",
								externalId: "#99",
								externalSource: "github",
								externalLinks: [{ externalId: "#99", externalUrl: "" }],
							},
						],
					},
				});
			}
			return route.fulfill({ json: [] });
		});

		await page.getByRole("button", { name: /link issue/i }).click();
		await page.getByPlaceholder(/search issues by number or title/i).fill("login");
		await page.keyboard.press("Enter");

		await expect(page.getByText("Update login flow")).toBeVisible();
	});

	test("search error shows an error message in the picker", async ({ page }) => {
		await page.route("**/api/tasks**", async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === "search") {
				return route.fulfill({ status: 500, json: { error: "Search failed" } });
			}
			return route.fulfill({ json: [] });
		});

		await page.getByRole("button", { name: /link issue/i }).click();
		await page.getByPlaceholder(/search issues by number or title/i).fill("anything");
		await page.getByRole("button", { name: /^search$/i }).click();

		await expect(page.getByText("Search failed")).toBeVisible();
	});

	test("standup form has the expected fields and submit button", async ({ page }) => {
		await expect(
			page.getByPlaceholder(/what did you work on/i)
		).toBeVisible();
		await expect(
			page.getByPlaceholder(/what will you work on next/i)
		).toBeVisible();
		await expect(
			page.getByPlaceholder(/any blockers/i)
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: /save standup note/i })
		).toBeVisible();
	});

	test("searching returns results and linking a task adds it to the list", async ({
		page,
	}) => {
		const MOCK_TASK = {
			id: "task-1",
			title: "Fix authentication bug",
			status: "in_progress",
			externalId: "#42",
			externalSource: "github",
			externalLinks: [
				{
					externalId: "#42",
					externalUrl:
						"https://github.com/testuser/test-repo/issues/42",
				},
			],
		};

		// Override the tasks mock to differentiate search vs resolve actions
		await page.route("**/api/tasks**", async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === "search") {
				return route.fulfill({ json: { tasks: [MOCK_TASK] } });
			}
			if (body?.action === "resolve") {
				return route.fulfill({ json: { task: MOCK_TASK } });
			}
			return route.fulfill({ json: [] });
		});

		// Open picker and search
		await page.getByRole("button", { name: /link issue/i }).click();
		await page.getByPlaceholder(/search issues by number or title/i).fill("auth");
		await page.getByRole("button", { name: /^search$/i }).click();

		// Search result should appear
		await expect(page.getByText("Fix authentication bug")).toBeVisible();

		// Click the result to link it
		await page.locator("button").filter({ hasText: "Fix authentication bug" }).click();

		// Dialog closes after linking
		await expect(page.getByRole("dialog")).not.toBeVisible();

		// Task appears in the linked list
		await expect(page.getByText("Fix authentication bug")).toBeVisible();
		await expect(page.getByText("#42")).toBeVisible();
	});
});

test.describe("Task Linking - Edit Flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.route("https://api.github.com/**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/milestones**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route("**/api/tasks**", (route) =>
			route.fulfill({ json: [] })
		);
		await page.route(`**/api/standups/${STANDUP_ID}`, (route) =>
			route.fulfill({ json: MOCK_STANDUP })
		);
		await page.route("**/api/standups**", (route) =>
			route.fulfill({ json: [MOCK_STANDUP] })
		);

		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);

		await page.goto(`/standup/${STANDUP_ID}/edit`);
		await expect(
			page.getByRole("button", { name: /link issue/i })
		).toBeVisible();
	});

	test("edit form shows task linking section", async ({ page }) => {
		await expect(
			page.locator("h3").filter({ hasText: "Linked Issues" })
		).toBeVisible();
		await expect(page.getByText("No linked issues yet")).toBeVisible();
	});

	// Fresh navigation helper — clears in-memory React Query cache so useState in StandupEditForm initializes from the new mock, not stale cached data.
	async function freshNavigateToEdit(page: import("@playwright/test").Page) {
		await page.goto("/");
		await page.evaluate((auth) => {
			localStorage.setItem("standup-storage", JSON.stringify(auth));
		}, MOCK_AUTH);
		await page.goto(`/standup/${STANDUP_ID}/edit`);
	}

	test("pre-existing linked tasks are pre-populated in the edit form", async ({ page }) => {
		await page.route(`**/api/standups/${STANDUP_ID}`, (route) =>
			route.fulfill({ json: { ...MOCK_STANDUP, linkedTasks: [MOCK_TASK] } })
		);

		await freshNavigateToEdit(page);
		await expect(page.getByRole("button", { name: /link issue/i })).toBeVisible();

		await expect(page.getByText("Fix authentication bug")).toBeVisible();
		await expect(page.getByText("#42")).toBeVisible();
	});

	test("linking an issue and saving shows a success toast", async ({ page }) => {
		await page.route("**/api/tasks**", async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === "search") {
				return route.fulfill({ json: { tasks: [MOCK_TASK] } });
			}
			if (body?.action === "resolve") {
				return route.fulfill({ json: { task: MOCK_TASK } });
			}
			return route.fulfill({ json: [] });
		});
		await page.route(`**/api/standups/${STANDUP_ID}`, async (route) => {
			if (route.request().method() === "PUT") {
				return route.fulfill({
					json: { ...MOCK_STANDUP, linkedTasks: [MOCK_TASK] },
				});
			}
			return route.fulfill({ json: MOCK_STANDUP });
		});

		await page.getByRole("button", { name: /link issue/i }).click();
		await page.getByPlaceholder(/search issues by number or title/i).fill("auth");
		await page.getByRole("button", { name: /^search$/i }).click();
		await page.locator("button").filter({ hasText: "Fix authentication bug" }).click();
		await expect(page.getByRole("dialog")).not.toBeVisible();
		await expect(page.getByText("Fix authentication bug")).toBeVisible();

		await page.getByRole("button", { name: /save changes/i }).click();

		await expect(page.getByText(/standup updated/i)).toBeVisible();
	});

	test("removing a pre-existing linked task and saving clears it from the detail view", async ({ page }) => {
		await page.route(`**/api/standups/${STANDUP_ID}`, async (route) => {
			if (route.request().method() === "PUT") {
				return route.fulfill({
					json: { ...MOCK_STANDUP, linkedTasks: [] },
				});
			}
			return route.fulfill({
				json: { ...MOCK_STANDUP, linkedTasks: [MOCK_TASK] },
			});
		});

		await freshNavigateToEdit(page);
		await expect(page.getByRole("button", { name: /link issue/i })).toBeVisible();
		await expect(page.getByText("Fix authentication bug")).toBeVisible();

		await page.getByText("Fix authentication bug").hover();
		await page.getByRole("button", { name: /remove linked issue/i }).click();
		await expect(page.getByText("Fix authentication bug")).not.toBeVisible();
		await expect(page.getByText("No linked issues yet")).toBeVisible();

		await page.getByRole("button", { name: /save changes/i }).click();
		await expect(page.getByText(/standup updated/i)).toBeVisible();

		await page.waitForURL(`**/standup/${STANDUP_ID}`);
		await expect(
			page.locator("section").filter({ hasText: "Linked Issues" })
		).not.toBeVisible();
	});

	test("saving with no link changes preserves existing linked tasks", async ({ page }) => {
		await page.route(`**/api/standups/${STANDUP_ID}`, async (route) => {
			if (route.request().method() === "PUT") {
				return route.fulfill({
					json: { ...MOCK_STANDUP, linkedTasks: [MOCK_TASK] },
				});
			}
			return route.fulfill({
				json: { ...MOCK_STANDUP, linkedTasks: [MOCK_TASK] },
			});
		});

		await freshNavigateToEdit(page);
		await expect(page.getByRole("button", { name: /link issue/i })).toBeVisible();
		await expect(page.getByText("Fix authentication bug")).toBeVisible();

		await page.getByRole("button", { name: /save changes/i }).click();
		await expect(page.getByText(/standup updated/i)).toBeVisible();

		await page.waitForURL(`**/standup/${STANDUP_ID}`);
		await expect(page.getByText("Fix authentication bug")).toBeVisible();
	});

	test("cancelling edit does not persist a newly linked task", async ({ page }) => {
		await page.route("**/api/tasks**", async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === "search") {
				return route.fulfill({ json: { tasks: [MOCK_TASK] } });
			}
			if (body?.action === "resolve") {
				return route.fulfill({ json: { task: MOCK_TASK } });
			}
			return route.fulfill({ json: [] });
		});

		await page.getByRole("button", { name: /link issue/i }).click();
		await page.getByPlaceholder(/search issues by number or title/i).fill("auth");
		await page.getByRole("button", { name: /^search$/i }).click();
		await page.locator("button").filter({ hasText: "Fix authentication bug" }).click();
		await expect(page.getByText("Fix authentication bug")).toBeVisible();

		await page.getByRole("button", { name: /cancel/i }).click();

		await page.waitForURL(`**/standup/${STANDUP_ID}`);
		await expect(
			page.locator("section").filter({ hasText: "Linked Issues" })
		).not.toBeVisible();
	});

	test("save failure shows an error toast and keeps user on the edit form", async ({ page }) => {
		await page.route(`**/api/standups/${STANDUP_ID}`, async (route) => {
			if (route.request().method() === "PUT") {
				return route.fulfill({
					status: 500,
					json: { error: "Internal server error" },
				});
			}
			return route.fulfill({ json: MOCK_STANDUP });
		});

		await page.getByRole("button", { name: /save changes/i }).click();

		await expect(page.getByText(/internal server error/i)).toBeVisible();
		await expect(page).toHaveURL(new RegExp(`/standup/${STANDUP_ID}/edit`));
	});

	test("linked issue appears on the detail view after saving", async ({ page }) => {
		await page.route("**/api/tasks**", async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === "search") {
				return route.fulfill({ json: { tasks: [MOCK_TASK] } });
			}
			if (body?.action === "resolve") {
				return route.fulfill({ json: { task: MOCK_TASK } });
			}
			return route.fulfill({ json: [] });
		});
		await page.route(`**/api/standups/${STANDUP_ID}`, async (route) => {
			if (route.request().method() === "PUT") {
				return route.fulfill({
					json: { ...MOCK_STANDUP, linkedTasks: [MOCK_TASK] },
				});
			}
			return route.fulfill({
				json: { ...MOCK_STANDUP, linkedTasks: [MOCK_TASK] },
			});
		});

		await page.getByRole("button", { name: /link issue/i }).click();
		await page.getByPlaceholder(/search issues by number or title/i).fill("auth");
		await page.getByRole("button", { name: /^search$/i }).click();
		await page.locator("button").filter({ hasText: "Fix authentication bug" }).click();
		await page.getByRole("button", { name: /save changes/i }).click();

		await page.waitForURL(`**/standup/${STANDUP_ID}`);

		await expect(
			page.locator("section").filter({ hasText: "Linked Issues" })
		).toBeVisible();
		await expect(page.getByText("Fix authentication bug")).toBeVisible();
	});
});
