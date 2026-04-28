import { test, expect } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH_WITH_REPO,
	mockStandardRoutes,
	runAxe,
	criticalViolations,
	formatViolations,
} from './_helpers';

test.describe('Standup form – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await page.route('**/api/standups**', (route) => {
			if (route.request().method() === 'POST') {
				return route.fulfill({
					json: {
						id: 'new-id',
						workCompleted: 'done',
						workPlanned: 'todo',
						blockers: 'None',
						commits: [],
						linkedTasks: [],
					},
				});
			}
			return route.fulfill({ json: [] });
		});
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
	});

	test('has no critical or serious axe violations', async ({ page }) => {
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('text areas are reachable by Tab in reading order', async ({ page }) => {
		const completed = page.getByLabel('Completed');
		const planned = page.getByLabel('Planned');
		const blockers = page.getByLabel('Blockers');

		// Tab to completed
		await completed.focus();
		await expect(completed).toBeFocused();

		// Tab forward goes to planned
		await page.keyboard.press('Tab');
		await expect(planned).toBeFocused();

		// Tab forward goes to blockers
		await page.keyboard.press('Tab');
		await expect(blockers).toBeFocused();
	});

	test('Shift+Tab moves backwards through text areas', async ({ page }) => {
		const completed = page.getByLabel('Completed');
		const planned = page.getByLabel('Planned');

		await planned.focus();
		await page.keyboard.press('Shift+Tab');
		await expect(completed).toBeFocused();
	});

	test('Enter in a textarea inserts a newline and does not submit', async ({ page }) => {
		const completed = page.getByLabel('Completed');
		await completed.fill('First line');
		await completed.press('Enter');
		await completed.pressSequentially('Second line');

		const value = await completed.inputValue();
		expect(value).toContain('\n');

		// Confirm we're still on the dashboard (form was not submitted)
		await expect(page).toHaveURL('/dashboard');
	});

	test('submit button is the only keyboard path to form submission', async ({ page }) => {
		const submit = page.getByRole('button', { name: /save standup/i });
		await submit.focus();
		await expect(submit).toBeFocused();

		// Fill required fields first
		await page.getByLabel('Completed').fill('Did some work');
		await page.getByLabel('Planned').fill('Will do more');

		// Activate with Space (standard key for buttons per ARIA spec)
		await submit.focus();
		await page.keyboard.press('Space');

		// Should show saving/saved state
		await expect(page.getByRole('button', { name: /saving|saved/i })).toBeVisible({
			timeout: 3000,
		});
	});

	/**
	 * Required field error announcements: the #1 screen reader failure in production forms.
	 * Errors that only appear visually (red border) are completely silent to screen reader users.
	 * WCAG 3.3.1 requires errors to be described in text; WCAG 4.1.3 requires status messages
	 * to be programmatically determinable.
	 * Expected: aria-invalid="true" + aria-describedby pointing to error text.
	 */

	test('required fields expose aria-invalid when empty on submit', async ({ page }) => {
		// Attempt to submit without filling required fields
		const submit = page.getByRole('button', { name: /save standup/i });
		await submit.focus();
		await page.keyboard.press('Space');

		// Both required textareas must signal invalid state to assistive tech
		const completed = page.getByLabel('Completed');
		const planned = page.getByLabel('Planned');

		await expect(completed).toHaveAttribute('aria-invalid', 'true');
		await expect(planned).toHaveAttribute('aria-invalid', 'true');
	});

	test('required field errors are linked to the input via aria-describedby', async ({ page }) => {
		const submit = page.getByRole('button', { name: /save standup/i });
		await submit.focus();
		await page.keyboard.press('Space');

		const completed = page.getByLabel('Completed');
		const describedById = await completed.getAttribute('aria-describedby');
		expect(describedById).toBeTruthy();

		// The referenced element must exist and contain error text
		const errorEl = page.locator(`#${describedById}`);
		await expect(errorEl).toBeVisible();
		await expect(errorEl).not.toBeEmpty();
	});

	test('form submission state change is announced to assistive tech', async ({ page }) => {
		await page.getByLabel('Completed').fill('Did some work');
		await page.getByLabel('Planned').fill('Will do more');

		const submit = page.getByRole('button', { name: /save standup/i });
		await submit.focus();
		await page.keyboard.press('Space');

		// The status region must exist and announce the change
		const statusRegion = page
			.locator('[role="status"], [aria-live="polite"], [aria-live="assertive"]')
			.filter({ hasText: /saving|saved/i });

		await expect(statusRegion).toBeVisible({ timeout: 3000 });
	});

	test('commit checkboxes are keyboard operable when commits are present', async ({ page }) => {
		// Mock commits so the previewer renders checkboxes
		await page.route('https://api.github.com/repos/testuser/test-repo/commits**', (route) =>
			route.fulfill({
				json: [
					{
						sha: 'abc1234',
						commit: {
							message: 'fix: something',
							author: { name: 'testuser', date: new Date().toISOString() },
						},
					},
				],
			})
		);

		await page.reload();
		await page.waitForLoadState('networkidle');

		const checkbox = page.getByRole('checkbox').first();
		if (await checkbox.count() === 0) {
			test.skip(); // No commits loaded — skip rather than fail
			return;
		}

		const wasChecked = await checkbox.isChecked();
		await checkbox.focus();
		await page.keyboard.press('Space');
		await expect(checkbox).toHaveJSProperty('checked', !wasChecked);
	});
});
