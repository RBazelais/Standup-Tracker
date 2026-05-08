import { test, expect, type Page, type Route } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH,
	mockStandardRoutes,
	runAxe,
	criticalViolations,
	formatViolations,
} from './_helpers';

async function goToSettings(page: Page) {
	await mockStandardRoutes(page);
	await page.route('**/api/integrations**', (route: Route) =>
		route.fulfill({ json: { connected: false } })
	);
	await loginAs(page, MOCK_AUTH);
	await page.goto('/settings');
	await page.waitForLoadState('networkidle');
}

async function goToSettingsConnected(page: Page) {
	await mockStandardRoutes(page);
	await page.route('**/api/integrations**', (route: Route) =>
		route.fulfill({ json: { connected: true, accountName: 'My Jira Site' } })
	);
	await loginAs(page, MOCK_AUTH);
	await page.goto('/settings');
	await page.waitForLoadState('networkidle');
}

test.describe('Settings – accessibility', () => {
	test('has no critical or serious axe violations (Jira disconnected)', async ({ page }) => {
		await goToSettings(page);
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('has no critical or serious axe violations (Jira connected)', async ({ page }) => {
		await goToSettingsConnected(page);
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('integrations section has an accessible label', async ({ page }) => {
		await goToSettings(page);
		await expect(page.getByRole('region', { name: /integrations/i })).toBeVisible();
	});

	test('Connect button is keyboard reachable', async ({ page }) => {
		await goToSettings(page);
		const connectBtn = page.getByRole('button', { name: /^connect$/i });
		await connectBtn.focus();
		await expect(connectBtn).toBeFocused();
	});

	test('Disconnect button is reachable by Tab when Jira is connected', async ({ page }) => {
		await goToSettingsConnected(page);
		const disconnectBtn = page.getByRole('button', { name: /disconnect/i });
		await disconnectBtn.focus();
		await expect(disconnectBtn).toBeFocused();
	});

	test('GitHub connected status is conveyed without relying on color alone', async ({ page }) => {
		await goToSettings(page);
		// In the disconnected state, "Connected" only appears once — next to GitHub
		await expect(page.getByText('Connected', { exact: true })).toBeVisible();
	});

	test('Jira "Not connected" status is readable by assistive tech', async ({ page }) => {
		await goToSettings(page);
		await expect(page.getByText('Not connected')).toBeVisible();
	});

	test('Jira site name is visible when connected', async ({ page }) => {
		await goToSettingsConnected(page);
		await expect(page.getByText('My Jira Site')).toBeVisible();
	});
});
