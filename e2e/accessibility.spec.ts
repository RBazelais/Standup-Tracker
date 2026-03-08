import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
	test("landing page should not have any accessibility violations", async ({
		page,
	}) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("landing page should have sufficient color contrast", async ({
		page,
	}) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2aa"])
			.include(".container") // Scan main content
			.analyze();

		// Filter for color contrast violations
		const contrastViolations = accessibilityScanResults.violations.filter(
			(violation) =>
				violation.id === "color-contrast" ||
				violation.id === "color-contrast-enhanced",
		);

		expect(contrastViolations).toEqual([]);
	});

	test("dashboard should not have any accessibility violations", async ({
		page,
	}) => {
		// Note: This will require authentication setup
		// For now, we'll skip if not authenticated
		await page.goto("/dashboard");

		// Check if we're redirected to login
		const isLoginPage = await page
			.getByRole("button", { name: /sign in with github/i })
			.isVisible()
			.catch(() => false);

		if (isLoginPage) {
			test.skip();
		}

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("form inputs should have proper labels and contrast", async ({
		page,
	}) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.disableRules(["page-has-heading-one"]) // May not apply to all pages
			.analyze();

		// Check for form-related violations
		const formViolations = accessibilityScanResults.violations.filter(
			(violation) =>
				violation.id.includes("label") ||
				violation.id.includes("input") ||
				violation.id === "color-contrast",
		);

		expect(formViolations).toEqual([]);
	});

	test("interactive elements should be keyboard accessible", async ({
		page,
	}) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a"])
			.analyze();

		// Check for keyboard accessibility violations
		const keyboardViolations = accessibilityScanResults.violations.filter(
			(violation) =>
				violation.id.includes("keyboard") ||
				violation.id.includes("focus") ||
				violation.id === "tabindex",
		);

		expect(keyboardViolations).toEqual([]);
	});

	test("should check for ARIA attributes", async ({ page }) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();

		// Check for ARIA-related violations
		const ariaViolations = accessibilityScanResults.violations.filter(
			(violation) => violation.id.includes("aria"),
		);

		expect(ariaViolations).toEqual([]);
	});
});
