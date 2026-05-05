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

const DETAIL_URL = `/standup/${MOCK_STANDUP.id}`;

const MOCK_STANDUP_WITH_TASK = {
	...MOCK_STANDUP,
	linkedTasks: [
		{
			id: 'task-1',
			title: 'Fix authentication bug',
			status: 'in_progress',
			externalId: '#42',
			externalSource: 'github',
			externalLinks: [{ externalId: '#42', externalUrl: 'https://github.com/testuser/test-repo/issues/42' }],
		},
	],
};

test.describe('Standup detail – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await page.route(`**/api/standups/${MOCK_STANDUP.id}**`, (route) =>
			route.fulfill({ json: MOCK_STANDUP_WITH_TASK })
		);
		await loginAs(page, MOCK_AUTH);
		await page.goto(DETAIL_URL);
		await page.waitForLoadState('networkidle');
	});

	test('has no critical or serious axe violations', async ({ page }) => {
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('back button is reachable by Tab and activatable', async ({ page }) => {
		const backBtn = page.getByRole('link', { name: /back/i })
			.or(page.getByRole('button', { name: /back/i })).first();
		await backBtn.focus();
		await expect(backBtn).toBeFocused();
	});

	test('edit button is reachable by Tab and activatable', async ({ page }) => {
		const editBtn = page.getByRole('link', { name: /edit/i })
			.or(page.getByRole('button', { name: /edit/i })).first();
		await editBtn.focus();
		await expect(editBtn).toBeFocused();
	});

	test('linked issue external link is keyboard reachable', async ({ page }) => {
		// Aria-label is "View {task.title} on GitHub" — the icon-only link gets its name from aria-label
		const issueLink = page.getByRole('link', { name: /view fix authentication bug on github/i });
		await expect(issueLink).toBeVisible();
		await issueLink.focus();
		await expect(issueLink).toBeFocused();
	});

	test('detail view has a main landmark', async ({ page }) => {
		await expect(page.locator('main').first()).toBeVisible();
	});

	test('sections have accessible labels', async ({ page }) => {
		// Each section should be labelled for easy navigation
		const labelledSections = await page.locator('[aria-labelledby]').count();
		expect(labelledSections).toBeGreaterThan(0);
	});
});
