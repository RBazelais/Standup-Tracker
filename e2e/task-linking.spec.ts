import { test, expect } from "@playwright/test";

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
});
