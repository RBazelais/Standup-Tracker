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
 * Sonner renders its <ol> container immediately on mount (via <Toaster> in
 * App.tsx), so the region is present before any toast fires. These tests
 * verify that contract and that the ARIA semantics are correct.
 */

test.describe('Toast live regions – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
	});

	test('toast container exists in DOM before any toast fires', async ({ page }) => {
		const toaster = page.locator('[data-sonner-toaster]');
		await expect(toaster).toBeAttached();
	});

	test('toast container has an accessible label', async ({ page }) => {
		const toaster = page.locator('[data-sonner-toaster]');
		const ariaLabel = await toaster.getAttribute('aria-label');
		expect(ariaLabel).toBeTruthy();
	});

	test('success toast uses role="status" for a polite announcement', async ({ page }) => {
		// Trigger a copy action which fires a success toast
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

		// Use copy dropdown to fire a success toast
		const copyDropdown = page.getByRole('button', { name: /copy/i }).first();
		if (await copyDropdown.count() === 0) {
			test.skip(); // No standup to copy from
			return;
		}

		await copyDropdown.click();
		const copyOption = page.getByRole('menuitem').first();
		await copyOption.click();

		// Sonner success toasts render with role="status"
		const successToast = page.locator('[data-sonner-toast][role="status"]');
		await expect(successToast).toBeAttached({ timeout: 3000 });
	});

	test('submission error toast uses role="alert" for an assertive announcement', async ({ page }) => {
		// Force a network error on standup creation
		await page.route('**/api/standups**', (route) => {
			if (route.request().method() === 'POST') {
				return route.fulfill({ status: 500, json: { error: 'Server error' } });
			}
			return route.fulfill({ json: [] });
		});

		await page.getByLabel('Completed').fill('Some work');
		await page.getByLabel('Planned').fill('More work');
		await page.getByRole('button', { name: /save standup/i }).click();

		// Sonner error toasts render with role="alert"
		const errorToast = page.locator('[data-sonner-toast][role="alert"]');
		await expect(errorToast).toBeAttached({ timeout: 3000 });
	});
});
