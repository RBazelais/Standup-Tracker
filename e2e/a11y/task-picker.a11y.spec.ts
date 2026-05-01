import { test, expect } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH_WITH_REPO,
	mockStandardRoutes,
	runAxe,
	criticalViolations,
	formatViolations,
} from './_helpers';

const MOCK_SEARCH_RESULTS = [
	{
		id: 'task-1',
		title: 'Fix authentication bug',
		status: 'in_progress',
		externalId: '#42',
		externalSource: 'github',
		externalLinks: [{ externalId: '#42', externalUrl: 'https://github.com/testuser/test-repo/issues/42' }],
	},
	{
		id: 'task-2',
		title: 'Update login flow',
		status: 'planned',
		externalId: '#99',
		externalSource: 'github',
		externalLinks: [{ externalId: '#99', externalUrl: '' }],
	},
];

test.describe('Task picker dialog – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await page.route('**/api/standups**', (route) => route.fulfill({ json: [] }));
		await page.route('**/api/tasks**', async (route) => {
			const body = route.request().postDataJSON();
			if (body?.action === 'search') {
				return route.fulfill({ json: { tasks: MOCK_SEARCH_RESULTS } });
			}
			if (body?.action === 'resolve') {
				return route.fulfill({ json: { task: MOCK_SEARCH_RESULTS[0] } });
			}
			return route.fulfill({ json: { tasks: [], resolved: [], autoLinked: [] } });
		});
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
	});

	async function openPicker(page: Parameters<typeof test>[1]['page']) {
		await page.getByRole('button', { name: /link issue/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
	}

	test('has no critical or serious axe violations when open', async ({ page }) => {
		await openPicker(page);
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('focus moves into the dialog when it opens', async ({ page }) => {
		await openPicker(page);

		const focusIsInsideDialog = await page.evaluate(() => {
			const dialog = document.querySelector('[role="dialog"]');
			const focused = document.activeElement;
			return dialog ? dialog.contains(focused) : false;
		});

		expect(focusIsInsideDialog).toBe(true);
	});

	test('search input receives focus on open', async ({ page }) => {
		await openPicker(page);
		const searchInput = page.getByPlaceholder(/search issues/i);
		await expect(searchInput).toBeFocused();
	});

	test('Tab key stays within the dialog', async ({ page }) => {
		await openPicker(page);

		// Tab through all focusable elements multiple times — none should escape
		for (let i = 0; i < 10; i++) {
			await page.keyboard.press('Tab');
			const escapedDialog = await page.evaluate(() => {
				const dialog = document.querySelector('[role="dialog"]');
				const focused = document.activeElement;
				// body or html means focus escaped
				if (!focused || focused === document.body) return true;
				return dialog ? !dialog.contains(focused) : true;
			});
			expect(escapedDialog).toBe(false);
		}
	});

	test('Shift+Tab stays within the dialog', async ({ page }) => {
		await openPicker(page);

		for (let i = 0; i < 6; i++) {
			await page.keyboard.press('Shift+Tab');
			const escapedDialog = await page.evaluate(() => {
				const dialog = document.querySelector('[role="dialog"]');
				const focused = document.activeElement;
				if (!focused || focused === document.body) return true;
				return dialog ? !dialog.contains(focused) : true;
			});
			expect(escapedDialog).toBe(false);
		}
	});

	test('ESC closes the dialog', async ({ page }) => {
		await openPicker(page);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeAttached();
	});

	test('focus returns to the "Link issue" button after ESC', async ({ page }) => {
		const trigger = page.getByRole('button', { name: /link issue/i });
		await openPicker(page);
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeAttached();
		await expect(trigger).toBeFocused();
	});

	test('focus returns to the "Link issue" button after clicking close', async ({ page }) => {
		const trigger = page.getByRole('button', { name: /link issue/i });
		await openPicker(page);

		const closeButton = page.getByRole('button', { name: /close/i })
			.or(page.locator('[data-radix-dialog-close]'));
		if (await closeButton.count() > 0) {
			await closeButton.first().click();
		} else {
			await page.keyboard.press('Escape'); // Fallback
		}

		await expect(page.getByRole('dialog')).not.toBeAttached();
		await expect(trigger).toBeFocused();
	});

	test('search can be triggered by keyboard', async ({ page }) => {
		await openPicker(page);

		await page.getByPlaceholder(/search issues/i).fill('auth');
		await page.keyboard.press('Enter');

		await expect(page.getByText('Fix authentication bug')).toBeVisible({ timeout: 3000 });
	});

	test('search results are selectable by keyboard', async ({ page }) => {
		await openPicker(page);
		await page.getByPlaceholder(/search issues/i).fill('auth');
		await page.keyboard.press('Enter');
		await expect(page.getByText('Fix authentication bug')).toBeVisible({ timeout: 3000 });

		// Tab to first result and activate with Enter
		const firstResult = page.locator('button').filter({ hasText: 'Fix authentication bug' });
		await firstResult.focus();
		await page.keyboard.press('Enter');

		// Dialog should close and task should be linked
		await expect(page.getByRole('dialog')).not.toBeAttached();
	});
});
