import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type JiraStatus = 'loading' | 'connected' | 'disconnected' | 'error';

const GitHubIcon = ({ className }: { className?: string }) => (
	<svg role="img" aria-label="GitHub" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
		<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
	</svg>
);

const JiraIcon = ({ className }: { className?: string }) => (
	<svg role="img" aria-label="Jira" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor">
		<path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.005 1.005 0 0 0-1.001-1.005zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
	</svg>
);

export function Settings() {
	const { user } = useStore();
	const [jiraStatus, setJiraStatus] = useState<JiraStatus>('loading');
	const [jiraSiteName, setJiraSiteName] = useState<string | null>(null);

	useEffect(() => {
		const jira = new URLSearchParams(window.location.search).get('jira');
		if (!jira) return;

		// Clean the URL before the toast so a page refresh doesn't re-trigger it.
		// replaceState is synchronous — if StrictMode re-runs this effect, the param
		// is already gone and we return early above.
		window.history.replaceState({}, '', window.location.pathname);

		// Defer past the effects phase so the Toaster has subscribed to Sonner's
		// state store before we enqueue the notification. No cleanup — StrictMode
		// would cancel the timer between its two effect runs, and the second run
		// sees a clean URL and early-returns, leaving no toast.
		setTimeout(() => {
			if (jira === 'connected') toast.success('Jira connected successfully');
			else if (jira === 'denied') toast.info('Jira connection was cancelled');
			else if (jira === 'error') toast.error('Failed to connect Jira. Please try again.');
		}, 0);
	}, []);

	useEffect(() => {
		if (!user?.id) return;

		fetch(`/api/integrations/status?userId=${user.id}&source=jira`)
			.then(r => r.json())
			.then(data => {
				setJiraStatus(data.connected ? 'connected' : 'disconnected');
				setJiraSiteName(data.accountName);
			})
			.catch(() => setJiraStatus('error'));
	}, [user?.id]);

	const handleConnectJira = () => {
		window.location.href = `/api/auth/jira?userId=${user?.id}`;
	};

	return (
		<div className="min-h-screen bg-surface">
			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<header className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
					<p className="text-lg text-foreground-muted">Manage your integrations and preferences.</p>
				</header>

				<div className="space-y-6">
					<section aria-labelledby="integrations-heading">
						<h2 id="integrations-heading" className="text-sm font-medium text-foreground-muted mb-2">
							Integrations
						</h2>
						<Card className="p-6 divide-y divide-border">
							<div className="flex items-center justify-between pb-4">
								<div className="flex items-center gap-3">
									<GitHubIcon className="h-5 w-5 text-foreground" />
									<div>
										<p className="text-sm font-medium text-foreground">GitHub</p>
										<p className="text-xs text-foreground-muted">{user?.login}</p>
									</div>
								</div>
								<span className="text-xs font-medium text-green-400">Connected</span>
							</div>

							<div className="flex items-center justify-between pt-4">
								<div className="flex items-center gap-3">
									<JiraIcon className="h-5 w-5 text-[#0052CC]" />
									<div>
										<p className="text-sm font-medium text-foreground">Jira</p>
										{jiraStatus === 'connected' && jiraSiteName && (
											<p className="text-xs text-foreground-muted">{jiraSiteName}</p>
										)}
										{jiraStatus === 'disconnected' && (
											<p className="text-xs text-foreground-muted">Not connected</p>
										)}
										{jiraStatus === 'loading' && (
											<p className="text-xs text-foreground-muted">Checking...</p>
										)}
									</div>
								</div>
								<div>
									{jiraStatus === 'loading' && null}
									{jiraStatus === 'connected' && (
										<span className="text-xs font-medium text-green-400">Connected</span>
									)}
									{jiraStatus === 'disconnected' && (
										<Button size="sm" onClick={handleConnectJira}>
											Connect
										</Button>
									)}
									{jiraStatus === 'error' && (
										<Button size="sm" variant="outline" onClick={handleConnectJira}>
											Retry
										</Button>
									)}
								</div>
							</div>
						</Card>
					</section>
				</div>
			</main>
		</div>
	);
}
