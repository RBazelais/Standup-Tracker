import { test, expect } from '@playwright/test';

const MOCK_AUTH = {
	state: {
		accessToken: 'gho_fake_test_token',
		user: {
			id: 1,
			login: 'testuser',
			name: 'Test User',
			avatar_url: 'https://github.com/identicons/testuser.png',
		},
		selectedRepo: null,
		selectedBranch: null,
		repos: [],
	},
	version: 0,
};

async function navigateToSettings(page: import('@playwright/test').Page, path = '/settings') {
	await page.goto('/');
	await page.evaluate((auth) => {
		localStorage.setItem('standup-storage', JSON.stringify(auth));
	}, MOCK_AUTH);
	await page.goto(path);
}

test.describe('Settings page', () => {
	// Integrations section 

	test('shows the Settings heading', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: false, accountName: null } })
		);

		await navigateToSettings(page);

		await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
	});

	test('shows GitHub account as connected with the correct login', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: false, accountName: null } })
		);

		await navigateToSettings(page);

		const integrationsSection = page.getByRole('region', { name: /integrations/i });
		await expect(integrationsSection.getByText('GitHub')).toBeVisible();
		await expect(integrationsSection.getByText('testuser')).toBeVisible();
		await expect(integrationsSection.getByText('Connected').first()).toBeVisible();
	});

	test('shows Connect button when Jira is not connected', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: false, accountName: null } })
		);

		await navigateToSettings(page);

		await expect(page.getByText('Jira')).toBeVisible();
		await expect(page.getByText('Not connected')).toBeVisible();
		await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
	});

	test('shows Connected status and site name when Jira is connected', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: true, accountName: 'mysite' } })
		);

		await navigateToSettings(page);

		await expect(page.getByText('Jira')).toBeVisible();
		await expect(page.getByText('mysite')).toBeVisible();
		await expect(page.getByText('Connected').nth(1)).toBeVisible();
	});

	// Disconnect 

	test('shows a Disconnect button when Jira is connected', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: true, accountName: 'mysite' } })
		);

		await navigateToSettings(page);

		await expect(page.getByRole('button', { name: /disconnect/i })).toBeVisible();
	});

	test('switches to Connect button after disconnecting Jira', async ({ page }) => {
		const jira = { connected: true, accountName: 'mysite' as string | null };

		await page.route('**/api/integrations**', async (route) => {
			if (route.request().method() === 'DELETE') {
				jira.connected = false;
				jira.accountName = null;
				await route.fulfill({ status: 200, json: { disconnected: true } });
				return;
			}
			await route.fulfill({ json: jira });
		});

		await navigateToSettings(page);
		await page.getByRole('button', { name: /disconnect/i }).click();

		await expect(page.getByRole('button', { name: /^connect$/i })).toBeVisible();
	});

	// OAuth redirect-back toasts 

	test('shows a success toast when returning from a successful Jira connection', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: true, accountName: 'mysite' } })
		);

		await navigateToSettings(page, '/settings?jira=connected');

		await expect(page.getByText('Jira connected successfully')).toBeVisible();
	});

	test('shows an info toast when the user cancels the Jira connection', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: false, accountName: null } })
		);

		await navigateToSettings(page, '/settings?jira=denied');

		await expect(page.getByText('Jira connection was cancelled')).toBeVisible();
	});

	test('shows an error toast when the Jira connection fails', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: false, accountName: null } })
		);

		await navigateToSettings(page, '/settings?jira=error');

		await expect(page.getByText(/failed to connect jira/i)).toBeVisible();
	});

	test('clears the jira query param from the URL after showing the toast', async ({ page }) => {
		await page.route('**/api/integrations**', (route) =>
			route.fulfill({ json: { connected: true, accountName: 'mysite' } })
		);

		await navigateToSettings(page, '/settings?jira=connected');

		await expect(page.getByText('Jira connected successfully')).toBeVisible();
		await expect(page).toHaveURL(/\/settings$/);
	});
});
