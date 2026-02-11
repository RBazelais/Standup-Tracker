import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
	test("displays the main heading", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByRole("heading", { name: /never forget what you did/i })
		).toBeVisible();
	});

	test("displays the tagline", async ({ page }) => {
		await page.goto("/");

		await expect(
			page.getByText(/automatically pulls your commits/i)
		).toBeVisible();
	});

	test("shows Sign in with GitHub button", async ({ page }) => {
		await page.goto("/");

		const signInButton = page.getByRole("button", {
			name: /sign in with github/i,
		});
		await expect(signInButton).toBeVisible();
	});

	test("displays feature cards", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByText("Sync with Git")).toBeVisible();
		await expect(page.getByText("Link to SMART goals")).toBeVisible();
	});

	test("shows free tier messaging", async ({ page }) => {
		await page.goto("/");

		await expect(page.getByText(/free.*no credit card/i)).toBeVisible();
	});

	test("GitHub sign in button redirects to OAuth", async ({ page }) => {
		await page.goto("/");

		const signInButton = page.getByRole("button", {
			name: /sign in with github/i,
		});

		// Click and verify we navigate to GitHub
		await signInButton.click();
		await page.waitForURL(/github\.com/);

		// GitHub redirects to login first, which then goes to oauth/authorize
		expect(page.url()).toContain("github.com");
	});
});

test.describe("Navigation", () => {
	test("unauthenticated user sees landing page", async ({ page }) => {
		await page.goto("/");

		// Should show landing content, not dashboard
		await expect(
			page.getByRole("button", { name: /sign in with github/i })
		).toBeVisible();
	});

	test("navigating to /dashboard redirects to landing when not authenticated", async ({
		page,
	}) => {
		await page.goto("/dashboard");

		// Should redirect back to landing or show login prompt
		await expect(
			page.getByRole("button", { name: /sign in with github/i })
		).toBeVisible();
	});
});

test.describe("Accessibility", () => {
	test("page has correct title", async ({ page }) => {
		await page.goto("/");

		await expect(page).toHaveTitle(/standup/i);
	});

	test("sign in button is keyboard accessible", async ({ page }) => {
		await page.goto("/");

		// Tab to the sign in button
		await page.keyboard.press("Tab");

		const signInButton = page.getByRole("button", {
			name: /sign in with github/i,
		});

		// Button should be focusable
		await expect(signInButton).toBeFocused();
	});
});
