import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Mock data

export const MOCK_USER = {
	id: 1,
	login: 'testuser',
	name: 'Test User',
	avatar_url: 'https://github.com/identicons/testuser.png',
};

export const MOCK_REPO = {
	id: 123,
	name: 'test-repo',
	full_name: 'testuser/test-repo',
	private: false,
	default_branch: 'main',
	owner: { login: 'testuser' },
};

export const MOCK_AUTH = {
	state: {
		accessToken: 'gho_fake_test_token',
		user: MOCK_USER,
		selectedRepo: null,
		selectedBranch: null,
		repos: [],
	},
	version: 0,
};

// Auth with a repo already selected — makes the standup form visible
export const MOCK_AUTH_WITH_REPO = {
	state: {
		...MOCK_AUTH.state,
		selectedRepo: MOCK_REPO,
		selectedBranch: 'main',
		repos: [MOCK_REPO],
	},
	version: 0,
};

export const MOCK_STANDUP = {
	id: 'a1b2c3d4-0000-4000-8000-000000000001',
	date: '2026-04-16',
	workCompleted: 'Reviewed PRs and fixed deployment pipeline',
	workPlanned: 'Start on authentication refactor',
	blockers: 'None',
	commits: [],
	repoFullName: 'testuser/test-repo',
	linkedTasks: [],
};

// Multiple standups for testing history lists and varied card states.
// Includes: a recent standup with commits, one with active blockers, and one with linked tasks.
export const MOCK_STANDUPS = [
	{
		id: 'a1b2c3d4-0000-4000-8000-000000000001',
		date: '2026-04-16',
		workCompleted: 'Reviewed PRs and fixed deployment pipeline',
		workPlanned: 'Start on authentication refactor',
		blockers: 'None',
		commits: [
			{
				sha: 'abc1234',
				message: 'fix: correct null check in auth middleware',
				author: 'testuser',
				date: '2026-04-16T10:00:00Z',
			},
			{
				sha: 'def5678',
				message: 'chore: update dependencies',
				author: 'testuser',
				date: '2026-04-16T14:30:00Z',
			},
		],
		repoFullName: 'testuser/test-repo',
		linkedTasks: [],
	},
	{
		id: 'a1b2c3d4-0000-4000-8000-000000000002',
		date: '2026-04-15',
		workCompleted: 'Set up CI pipeline for E2E tests',
		workPlanned: 'Write accessibility tests for standup form',
		blockers: 'Waiting on DevOps to provision staging environment',
		commits: [],
		repoFullName: 'testuser/test-repo',
		linkedTasks: [],
	},
	{
		id: 'a1b2c3d4-0000-4000-8000-000000000003',
		date: '2026-04-14',
		workCompleted: 'Implemented task linking UI',
		workPlanned: 'Add keyboard navigation to task picker',
		blockers: 'None',
		commits: [
			{
				sha: 'ghi9012',
				message: 'feat: add task picker dialog with search',
				author: 'testuser',
				date: '2026-04-14T09:15:00Z',
			},
		],
		repoFullName: 'testuser/test-repo',
		linkedTasks: [
			{
				id: 'task-1',
				title: 'Add task linking feature',
				status: 'done',
				externalId: '#38',
				externalSource: 'github',
				externalLinks: [{ externalId: '#38', externalUrl: 'https://github.com/testuser/test-repo/issues/38' }],
			},
		],
	},
];

// Auth helpers
export async function loginAs(page: Page, auth: object = MOCK_AUTH) {
	await page.goto('/');
	await page.evaluate((a) => {
		localStorage.setItem('standup-storage', JSON.stringify(a));
	}, auth);
}

// Common API route mocks
export async function mockStandardRoutes(page: Page) {
	await page.route('https://api.github.com/**', (route) => route.fulfill({ json: [] }));
	await page.route('**/api/milestones**', (route) => route.fulfill({ json: [] }));
	await page.route('**/api/tasks**', (route) =>
		route.fulfill({ json: { tasks: [], resolved: [], autoLinked: [] } })
	);
}

// Animation helpers


// Waits for the last framer-motion section on the landing page to finish animating.
// On other pages this resolves immediately (element not found → early return true).
export async function waitForLandingAnimations(page: Page) {
	await page.waitForFunction(() => {
		const lastSection = document.querySelector('[aria-labelledby="preview-heading"]');
		if (!lastSection) return true;
		let el: Element | null = lastSection;
		while (el && el !== document.body) {
			if (parseFloat(getComputedStyle(el).opacity) < 0.99) return false;
			el = el.parentElement;
		}
		return true;
	});
}


// Axe helpers

export async function runAxe(page: Page) {
	return new AxeBuilder({ page }).analyze();
}

export function criticalViolations(
	violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']
) {
	return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
}

export function formatViolations(
	violations: ReturnType<typeof criticalViolations>
) {
	if (!violations.length) return '';
	return violations
		.map(
			(v) =>
				`[${v.impact}] ${v.id}: ${v.description}\n  ` +
				v.nodes.map((n) => n.html).join('\n  ')
		)
		.join('\n\n');
}