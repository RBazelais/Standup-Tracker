import { test, expect } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH_WITH_REPO,
	MOCK_STANDUP,
	MOCK_STANDUPS,
	mockStandardRoutes,
	runAxe,
	criticalViolations,
	formatViolations,
} from './_helpers';

test.describe('Dashboard – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await page.route('**/api/standups**', (route) =>
			route.fulfill({ json: MOCK_STANDUPS })
		);
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
	});

	test('has no critical or serious axe violations', async ({ page }) => {
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('skip link is the first focusable element', async ({ page }) => {
		await page.keyboard.press('Tab');
		const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
		expect(focused).toBe('Skip to main content');
	});

	test('standup history items are reachable by Tab', async ({ page }) => {
		const historyItem = page.getByRole('listitem').first();
		await expect(historyItem).toBeVisible();

		// The list item itself or a focusable child should be reachable
		const focusableChild = historyItem.locator('a, button').first();
		await focusableChild.focus();
		await expect(focusableChild).toBeFocused();
	});

	test('standup history items can be activated by Enter', async ({ page }) => {
		const firstLink = page.getByRole('listitem').first().locator('a, button').first();
		await firstLink.focus();
		await page.keyboard.press('Enter');

		// Should navigate somewhere (URL changes or a modal opens)
		await expect(page).not.toHaveURL('/dashboard', { timeout: 3000 });
	});

	test('navigating to dashboard lands focus in the main content area', async ({ page }) => {
		// Specific standup mock so detail page loads (registered after beforeEach general mock, wins LIFO)
		await page.route(`**/api/standups/${MOCK_STANDUP.id}**`, (route) =>
			route.fulfill({ json: MOCK_STANDUP })
		);

		// Use a full page load as the starting point (same pattern as standup-edit route-arrival test)
		await page.goto(`/standup/${MOCK_STANDUP.id}`);
		await page.waitForLoadState('networkidle');

		// SPA-navigate to dashboard via the header logo link
		await page.getByRole('link', { name: 'StandUp Tracker Home' }).click();
		await page.waitForURL('/dashboard');

		// Wait for focus to land in main-content rather than checking immediately after networkidle,
		// since React effects run asynchronously after the render and can lose the race with networkidle.
		await page.waitForFunction(() => {
			const main = document.getElementById('main-content');
			const focused = document.activeElement;
			return main ? main.contains(focused) || focused === main : false;
		});
	});
});
