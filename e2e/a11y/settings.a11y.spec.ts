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
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press('Tab');
			if (await connectBtn.evaluate(el => document.activeElement === el)) break;
		}
		await expect(connectBtn).toBeFocused();
	});

	test('Disconnect button is reachable by Tab when Jira is connected', async ({ page }) => {
		await goToSettingsConnected(page);
		const disconnectBtn = page.getByRole('button', { name: /disconnect/i });
		for (let i = 0; i < 15; i++) {
			await page.keyboard.press('Tab');
			if (await disconnectBtn.evaluate(el => document.activeElement === el)) break;
		}
		await expect(disconnectBtn).toBeFocused();
	});

	test('GitHub connected status is conveyed without relying on color alone', async ({ page }) => {
		await goToSettings(page);
		const statusText = page.getByText('Connected', { exact: true }).first();
		await expect(statusText).toBeVisible();
		const isAccessible = await statusText.evaluate(el => {
			let node: Element | null = el;
			while (node) {
				if (node.getAttribute('aria-hidden') === 'true') return false;
				node = node.parentElement;
			}
			return true;
		});
		expect(isAccessible).toBe(true);
	});

	test('Jira "Not connected" status is readable by assistive tech', async ({ page }) => {
		await goToSettings(page);
		const statusText = page.getByText('Not connected');
		await expect(statusText).toBeVisible();
		const isAccessible = await statusText.evaluate(el => {
			let node: Element | null = el;
			while (node) {
				if (node.getAttribute('aria-hidden') === 'true') return false;
				node = node.parentElement;
			}
			return true;
		});
		expect(isAccessible).toBe(true);
	});

	test('Jira site name is visible when connected', async ({ page }) => {
		await goToSettingsConnected(page);
		const siteNameText = page.getByText('My Jira Site');
		await expect(siteNameText).toBeVisible();
		const isAccessible = await siteNameText.evaluate(el => {
			let node: Element | null = el;
			while (node) {
				if (node.getAttribute('aria-hidden') === 'true') return false;
				node = node.parentElement;
			}
			return true;
		});
		expect(isAccessible).toBe(true);
	});
});
