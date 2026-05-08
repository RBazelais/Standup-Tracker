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
		await page.getByRole('button', { name: /link task/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('has no critical or serious axe violations when open', async ({ page }) => {
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('focus moves into the dialog when it opens', async ({ page }) => {

		const focusIsInsideDialog = await page.evaluate(() => {
			const dialog = document.querySelector('[role="dialog"]');
			const focused = document.activeElement;
			return dialog ? dialog.contains(focused) : false;
		});

		expect(focusIsInsideDialog).toBe(true);
	});

	test('search input receives focus on open', async ({ page }) => {
		const searchInput = page.getByPlaceholder(/search issues/i);
		await expect(searchInput).toBeFocused();
	});

	test('Tab key stays within the dialog', async ({ page }) => {

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
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeAttached();
	});

	test('focus returns to the "Link Task" button after ESC', async ({ page }) => {
		const trigger = page.getByRole('button', { name: /link task/i });
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeAttached();
		await expect(trigger).toBeFocused();
	});

	test('focus returns to the "Link Task" button after clicking close', async ({ page }) => {
		const trigger = page.getByRole('button', { name: /link task/i });
		const closeButton = page.getByRole('button', { name: /close/i });
		await expect(closeButton).toBeVisible();
		await closeButton.click();
		await expect(page.getByRole('dialog')).not.toBeAttached();
		await expect(trigger).toBeFocused();
	});

	test('search can be triggered by keyboard', async ({ page }) => {

		await page.getByPlaceholder(/search issues/i).fill('auth');
		await page.keyboard.press('Enter');

		await expect(page.getByText('Fix authentication bug')).toBeVisible({ timeout: 3000 });
	});

	test('search results are selectable by keyboard', async ({ page }) => {
		await page.getByPlaceholder(/search issues/i).fill('auth');
		await page.keyboard.press('Enter');
		await expect(page.getByText('Fix authentication bug')).toBeVisible({ timeout: 3000 });

		// Tab from the search input to the first result — no programmatic focus
		const firstResult = page.locator('button').filter({ hasText: 'Fix authentication bug' });
		for (let i = 0; i < 5; i++) {
			await page.keyboard.press('Tab');
			if (await firstResult.evaluate(el => document.activeElement === el)) break;
		}
		await expect(firstResult).toBeFocused();
		await page.keyboard.press('Enter');

		// Dialog closes and the linked task card appears in the task list
		await expect(page.getByRole('dialog')).not.toBeAttached();
		await expect(page.getByText('Fix authentication bug')).toBeVisible();
	});
});

test.describe('Task picker dialog – Jira disconnected state', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await page.route('**/api/standups**', (route) => route.fulfill({ json: [] }));
		await page.route('**/api/tasks**', (route) =>
			route.fulfill({ json: { tasks: [], resolved: [], autoLinked: [] } })
		);
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: false } })
		);
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: /link task/i }).click();
		await expect(page.getByRole('dialog')).toBeVisible();
	});

	test('has no critical or serious axe violations with connect prompt visible', async ({ page }) => {
		await page.getByRole('combobox', { name: /issue source/i }).click();
		await page.getByRole('option', { name: /connect to jira/i }).click();
		await expect(page.getByRole('link', { name: /go to settings/i })).toBeVisible();

		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('Connect to Jira option is reachable by keyboard', async ({ page }) => {
		const trigger = page.getByRole('combobox', { name: /issue source/i });
		await trigger.focus();
		await expect(trigger).toBeFocused();
		await page.keyboard.press('Space');
		await expect(page.getByRole('option', { name: /connect to jira/i })).toBeVisible();
	});

	test('Settings link in connect prompt is reachable by Tab', async ({ page }) => {
		await page.getByRole('combobox', { name: /issue source/i }).click();
		await page.getByRole('option', { name: /connect to jira/i }).click();
		await expect(page.getByRole('link', { name: /go to settings/i })).toBeVisible();

		const link = page.getByRole('link', { name: /go to settings/i });
		await page.getByRole('combobox', { name: /issue source/i }).focus();
		for (let i = 0; i < 5; i++) {
			await page.keyboard.press('Tab');
			if (await link.evaluate((el) => document.activeElement === el)) break;
		}
		await expect(link).toBeFocused();
	});

	test('Settings link has a visible focus indicator', async ({ page }) => {
		await page.getByRole('combobox', { name: /issue source/i }).click();
		await page.getByRole('option', { name: /connect to jira/i }).click();
		await expect(page.getByRole('link', { name: /go to settings/i })).toBeVisible();

		const link = page.getByRole('link', { name: /go to settings/i });
		await page.getByRole('combobox', { name: /issue source/i }).focus();
		for (let i = 0; i < 5; i++) {
			await page.keyboard.press('Tab');
			if (await link.evaluate((el) => document.activeElement === el)) break;
		}
		await expect(link).toBeFocused();

		const hasRing = await link.evaluate((el) => {
			return window.getComputedStyle(el).boxShadow !== 'none';
		});
		expect(hasRing).toBe(true);
	});

	test('focus stays within the dialog when connect prompt is shown', async ({ page }) => {
		await page.getByRole('combobox', { name: /issue source/i }).click();
		await page.getByRole('option', { name: /connect to jira/i }).click();

		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');
			const escaped = await page.evaluate(() => {
				const dialog = document.querySelector('[role="dialog"]');
				const focused = document.activeElement;
				if (!focused || focused === document.body) return true;
				return dialog ? !dialog.contains(focused) : true;
			});
			expect(escaped).toBe(false);
		}
	});
});
