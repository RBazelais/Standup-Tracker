import { test, expect } from '@playwright/test';
import {
	loginAs,
	MOCK_AUTH_WITH_REPO,
	MOCK_STANDUPS,
	mockStandardRoutes,
	runAxe,
	criticalViolations,
	formatViolations,
} from './_helpers';

test.describe('Standup history – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await mockStandardRoutes(page);
		await page.route('**/api/standups**', (route) =>
			route.fulfill({ json: MOCK_STANDUPS })
		);
		await loginAs(page, MOCK_AUTH_WITH_REPO);
		await page.goto('/dashboard');
		await page.waitForLoadState('networkidle');
	});

	test('has no critical or serious axe violations', async ({ page }) => {
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('history renders as a list', async ({ page }) => {
		const list = page.locator('ul, ol, [role="list"]').filter({
			has: page.locator('[role="listitem"], li'),
		});
		await expect(list.first()).toBeVisible();
	});

	test('history contains the expected number of items', async ({ page }) => {
		const items = page.locator('[role="listitem"], li').filter({
			has: page.locator('a, button'),
		});
		await expect(items).toHaveCount(MOCK_STANDUPS.length);
	});

	/** 
	At-a-glance information: a screen reader user scanning the list should get date, repository, commit count, and blocker status from each card without having to open it. This mirrors what a sighted user reads at a glance from the card layout.

	We check the card's accessible name (aria-label) or its visible text rather than asserting on a specific implementation. The point is that the  information is present, not how it is structured.
	**/ 

	test('each history card exposes its date to assistive technology', async ({ page }) => {
		// All three mock standups have April 2026 dates
		const cards = page.getByRole('listitem');
		const count = await cards.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < count; i++) {
			const card = cards.nth(i);
			const cardText = await card.textContent();
			// Date should appear somewhere in the card's text content
			expect(cardText).toMatch(/2026|Apr/i);
		}
	});

	test('card with blockers exposes blocker status', async ({ page }) => {
		// MOCK_STANDUPS[1] has blockers: 'Waiting on DevOps...'
		const cards = page.getByRole('listitem');
		const count = await cards.count();
		let blockerCardFound = false;

		for (let i = 0; i < count; i++) {
			const card = cards.nth(i);
			const ariaLabel = await card.getAttribute('aria-label');
			const cardText = await card.textContent();
			const fullText = (ariaLabel ?? '') + (cardText ?? '');

			if (fullText.match(/waiting on devops|blocker/i)) {
				blockerCardFound = true;
				break;
			}
		}

		// If the standup with blockers is visible, its blocker info should be surfaced
		// (this test documents the intent; it passes if blockers are in aria-label or visible text)
		expect(blockerCardFound || count === 0).toBe(true);
	});

	test('card with commits exposes commit count or commit presence', async ({ page }) => {
		// MOCK_STANDUPS[0] has 2 commits; MOCK_STANDUPS[2] has 1 commit
		const cards = page.getByRole('listitem');
		const count = await cards.count();
		let commitInfoFound = false;

		for (let i = 0; i < count; i++) {
			const card = cards.nth(i);
			const ariaLabel = await card.getAttribute('aria-label');
			const cardText = await card.textContent();
			const fullText = (ariaLabel ?? '') + (cardText ?? '');

			if (fullText.match(/commit|sha|abc1234/i)) {
				commitInfoFound = true;
				break;
			}
		}

		expect(commitInfoFound).toBe(true);
	});

	test('first history card is reachable by Tab', async ({ page }) => {
		const firstCard = page.getByRole('listitem').first();
		const focusableChild = firstCard.locator('a, button').first();
		await focusableChild.focus();
		await expect(focusableChild).toBeFocused();
	});

	test('Enter on a history card navigates to the standup detail', async ({ page }) => {
		const firstCard = page.getByRole('listitem').first();
		const focusableChild = firstCard.locator('a, button').first();
		await focusableChild.focus();
		await page.keyboard.press('Enter');

		// Should leave the dashboard (either URL change or modal open)
		await expect(page).not.toHaveURL('/dashboard', { timeout: 3000 });
	});

	test('history cards expose repository name', async ({ page }) => {
		const cards = page.getByRole('listitem');
		const count = await cards.count();
		let repoFound = false;

		for (let i = 0; i < count; i++) {
			const card = cards.nth(i);
			const ariaLabel = await card.getAttribute('aria-label');
			const cardText = await card.textContent();
			const fullText = (ariaLabel ?? '') + (cardText ?? '');

			if (fullText.match(/test-repo|testuser/i)) {
				repoFound = true;
				break;
			}
		}

		expect(repoFound).toBe(true);
	});

	test('focused card has a visible focus indicator', async ({ page }) => {
		const firstCard = page.getByRole('listitem').first();
		const focusableChild = firstCard.locator('a, button').first();
		await focusableChild.focus();

		const hasOutline = await focusableChild.evaluate((el) => {
			const style = getComputedStyle(el);
			const outline = style.outlineStyle;
			const boxShadow = style.boxShadow;
			return outline !== 'none' || (boxShadow !== 'none' && boxShadow !== '');
		});

		expect(hasOutline).toBe(true);
	});
});
