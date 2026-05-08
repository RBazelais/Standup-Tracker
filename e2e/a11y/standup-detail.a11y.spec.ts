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
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press('Tab');
			if (await backBtn.evaluate(el => document.activeElement === el)) break;
		}
		await expect(backBtn).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).not.toHaveURL(DETAIL_URL, { timeout: 3000 });
	});

	test('edit button is reachable by Tab and activatable', async ({ page }) => {
		const editBtn = page.getByRole('link', { name: /edit/i })
			.or(page.getByRole('button', { name: /edit/i })).first();
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press('Tab');
			if (await editBtn.evaluate(el => document.activeElement === el)) break;
		}
		await expect(editBtn).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).not.toHaveURL(DETAIL_URL, { timeout: 3000 });
	});

	test('linked issue external link is keyboard reachable', async ({ page }) => {
		const issueLink = page.getByRole('link', { name: /view fix authentication bug on github/i });
		await expect(issueLink).toBeVisible();
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press('Tab');
			if (await issueLink.evaluate(el => document.activeElement === el)) break;
		}
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
