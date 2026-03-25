// src/pages/test-task-linking.tsx (or wherever makes sense)
import { TaskLinkingSection } from '@/components/TaskLinking';

const mockCommits = [
	{ sha: 'abc1234', commit: { message: 'Fix bug in #42', author: null } },
	{ sha: 'def5678', commit: { message: 'Closes #123 - add feature', author: null } },
];

export default function TestPage() {
	return (
		<div className="p-8">
			<h1>Task Linking Test</h1>
			<TaskLinkingSection
				standup={{
				commits: mockCommits,
				repoFullName: 'RBazelais/standup-tracker',
				}}
				onTasksChange={(ids) => console.log('Selected:', ids)}
			/>
		</div>
	);
}