import { test, expect } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH_WITH_REPO,
	MOCK_STANDUP,
	mockStandardRoutes,
	runAxe,
	criticalViolations,
	formatViolations,
} from './_helpers';

const EDIT_URL = `/standup/${MOCK_STANDUP.id}/edit`;

test.describe('Standup edit – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		// General standups list — registered first so the specific-ID mock below wins (Playwright LIFO)
		await page.route('**/api/standups**', async (route) => {
			if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
				// Delay long enough for the "Saving..." button state to be visible
				await new Promise((r) => setTimeout(r, 300));
				return route.fulfill({ json: { ...MOCK_STANDUP, workCompleted: 'Updated' } });
			}
			return route.fulfill({ json: [MOCK_STANDUP] });
		});
		// Specific standup GET — registered last so it is evaluated first (Playwright LIFO)
		await page.route(`**/api/standups/${MOCK_STANDUP.id}**`, (route) => {
			if (route.request().method() === 'GET') {
				return route.fulfill({ json: MOCK_STANDUP });
			}
			return route.fallback();
		});
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto(EDIT_URL);
		await page.waitForLoadState('networkidle');
	});

	test('has no critical or serious axe violations', async ({ page }) => {
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('focus lands in the main content area on route arrival', async ({ page }) => {
		// Start at standup detail (full page load is the starting point, not the thing being tested)
		await page.goto(`/standup/${MOCK_STANDUP.id}`);
		await page.waitForLoadState('networkidle');

		// SPA-navigate to edit by clicking the Edit button
		await page.getByRole('button', { name: 'Edit standup note' }).click();
		await page.waitForURL(EDIT_URL);

		await page.waitForFunction(() => {
			const main = document.getElementById('main-content');
			const focused = document.activeElement;
			return main ? main.contains(focused) || focused === main : false;
		});
	});

	test('fields are pre-populated and screen readers can read their values', async ({ page }) => {
		// Verifies the edit view loads existing data into the inputs, not empty fields
		await expect(page.getByLabel('What you worked on')).toHaveValue(MOCK_STANDUP.workCompleted);
		await expect(page.getByLabel("What you'll work on next")).toHaveValue(MOCK_STANDUP.workPlanned);
	});

	test('text areas are reachable by Tab in reading order', async ({ page }) => {
		const completed = page.getByLabel('What you worked on');
		const planned = page.getByLabel("What you'll work on next");
		const blockers = page.getByLabel('Blockers');

		await completed.focus();
		await expect(completed).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(planned).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(blockers).toBeFocused();
	});

	test('Shift+Tab moves backwards through text areas', async ({ page }) => {
		const completed = page.getByLabel('What you worked on');
		const planned = page.getByLabel("What you'll work on next");

		await planned.focus();
		await page.keyboard.press('Shift+Tab');
		await expect(completed).toBeFocused();
	});

	test('save button is keyboard operable via Space', async ({ page }) => {
		const save = page.getByRole('button', { name: /save|update/i });
		await save.focus();
		await expect(save).toBeFocused();
		await page.keyboard.press('Space');

		await expect(page.getByRole('button', { name: /saving|saved/i })).toBeVisible({
			timeout: 3000,
		});
	});

	test('required fields expose aria-invalid when cleared and submitted', async ({ page }) => {
		await page.getByLabel('What you worked on').clear();
		await page.getByLabel("What you'll work on next").clear();

		const save = page.getByRole('button', { name: /save|update/i });
		await save.focus();
		await page.keyboard.press('Space');

		await expect(page.getByLabel('What you worked on')).toHaveAttribute('aria-invalid', 'true');
		await expect(page.getByLabel("What you'll work on next")).toHaveAttribute('aria-invalid', 'true');
	});

	test('cancel or back button is keyboard reachable', async ({ page }) => {
		const cancel = page.getByRole('link', { name: /cancel|back/i })
			.or(page.getByRole('button', { name: /cancel|back/i })).first();
		await cancel.focus();
		await expect(cancel).toBeFocused();
	});

	test('edit view has a main landmark', async ({ page }) => {
		await expect(page.locator('main').or(page.locator('#main-content'))).toBeVisible();
	});
});
