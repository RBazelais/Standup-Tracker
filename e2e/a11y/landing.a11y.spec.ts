import { test, expect } from '@playwright/test';
import { runAxe, criticalViolations, formatViolations, waitForLandingAnimations } from './_helpers';

test.describe('Landing page – accessibility', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await waitForLandingAnimations(page);
	});

	test('has no critical or serious axe violations', async ({ page }) => {
		const { violations } = await runAxe(page);
		const critical = criticalViolations(violations);
		expect(critical, formatViolations(critical)).toEqual([]);
	});

	test('skip link is the first focusable element', async ({ page }) => {
		await page.keyboard.press('Tab');
		const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
		expect(focused).toBe('Skip to main content');
	});

	test('skip link moves focus to main content on Enter', async ({ page }) => {
		await page.keyboard.press('Tab');
		await page.keyboard.press('Enter');
		const focusedId = await page.evaluate(() => document.activeElement?.id);
		expect(focusedId).toBe('main-content');
	});

	test('sign in button is reachable by Tab and activatable by Enter', async ({ page }) => {
		const button = page.getByRole('link', { name: /sign in with github/i })
			.or(page.getByRole('button', { name: /sign in with github/i }));

		for (let i = 0; i < 10; i++) {
			await page.keyboard.press('Tab');
			if (await button.evaluate(el => document.activeElement === el)) break;
		}
		await expect(button).toBeFocused();

		// Enter should activate it — the URL will leave '/' toward the auth flow
		await page.keyboard.press('Enter');
		await expect(page).not.toHaveURL('/', { timeout: 3000 });
	});

	test('content is visible with prefers-reduced-motion: reduce', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/');

		// All motion wrappers should immediately be at full opacity
		const allVisible = await page.evaluate(() => {
			const textEls = document.querySelectorAll('h1, p, button');
			for (const el of textEls) {
				let node: Element | null = el;
				while (node && node !== document.body) {
					if (parseFloat(getComputedStyle(node).opacity) < 0.01) return false;
					node = node.parentElement;
				}
			}
			return true;
		});

		expect(allVisible).toBe(true);
	});
});
