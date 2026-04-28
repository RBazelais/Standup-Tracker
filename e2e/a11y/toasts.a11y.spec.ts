import { test, expect } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH_WITH_REPO,
	mockStandardRoutes,
} from './_helpers';

/**
 * Toast / live region tests
 *
 * The #1 mistake with live regions: creating the region and adding content at
 * the same time. Screen readers only watch regions that existed when the page
 * loaded. If you inject the region dynamically at the same moment as the
 * content, the announcement never fires.
 *
 * In Sonner v2 the live region is a <section aria-live="polite"> that renders
 * immediately on mount. The <ol data-sonner-toaster> inside it is lazy — it
 * only appears when there are active toasts. That is fine: screen readers watch
 * the <section> from page load, so injecting the <ol> later still triggers the
 * announcement. These tests verify that contract and that the ARIA semantics
 * are correct.
 */

test.describe('Toast live regions – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
	});

	test('live region container exists in DOM before any toast fires', async ({ page }) => {
		// Sonner v2 renders <section aria-live="polite"> immediately on mount.
		// The <ol data-sonner-toaster> inside it is lazy (only present when toasts are active).
		const liveRegion = page.locator('section[aria-live="polite"]');
		await expect(liveRegion).toBeAttached();
	});

	test('live region container has an accessible label', async ({ page }) => {
		const liveRegion = page.locator('section[aria-live="polite"]');
		const ariaLabel = await liveRegion.getAttribute('aria-label');
		expect(ariaLabel).toBeTruthy();
	});

	test('success toast uses role="status" for a polite announcement', async ({ page }) => {
		await page.route('**/api/standups**', (route) =>
			route.fulfill({
				json: [
					{
						id: 'test-id',
						date: '2026-04-16',
						workCompleted: 'Done',
						workPlanned: 'Next',
						blockers: 'None',
						commits: [],
						linkedTasks: [],
						repoFullName: 'testuser/test-repo',
					},
				],
			})
		);
		await page.reload();
		await page.waitForLoadState('networkidle');

		const copyDropdown = page.getByRole('button', { name: /copy/i }).first();
		if (await copyDropdown.count() === 0) {
			test.skip();
			return;
		}

		await copyDropdown.click();
		const copyOption = page.getByRole('menuitem').first();
		await copyOption.click();

		const successToast = page.locator('[data-sonner-toast][role="status"]');
		await expect(successToast).toBeAttached({ timeout: 3000 });
	});

	test('submission error toast uses role="alert" for an assertive announcement', async ({ page }) => {
		await page.route('**/api/standups**', (route) => {
			if (route.request().method() === 'POST') {
				return route.fulfill({ status: 500, json: { error: 'Server error' } });
			}
			return route.fulfill({ json: [] });
		});

		await page.getByLabel('Completed').fill('Some work');
		await page.getByLabel('Planned').fill('More work');
		await page.getByRole('button', { name: /save standup/i }).click();

		const errorToast = page.locator('[data-sonner-toast][role="alert"]');
		await expect(errorToast).toBeAttached({ timeout: 3000 });
	});
});
