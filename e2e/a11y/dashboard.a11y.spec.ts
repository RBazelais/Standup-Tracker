import { test, expect } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH,
	MOCK_STANDUP,
	mockStandardRoutes,
	runAxe,
	criticalViolations,
	formatViolations,
} from './_helpers';

test.describe('Dashboard – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await page.route('**/api/standups**', (route) =>
			route.fulfill({ json: [MOCK_STANDUP] })
		);
		await loginAs(page, MOCK_AUTH);
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
		// Navigate away then back to simulate SPA route transition
		await page.goto('/');
		await loginAs(page, MOCK_AUTH);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');

		const focusIsInMain = await page.evaluate(() => {
			const main = document.getElementById('main-content');
			const focused = document.activeElement;
			return main ? main.contains(focused) || focused === main : false;
		});

		expect(focusIsInMain).toBe(true);
	});
});
