export interface GitHubUser {
    login: string;
    name: string;
    avatar_url: string;
    id: number;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    owner: {
        login: string;
    };
    private: boolean;
}

export interface GitHubCommit {
    sha: string;
    commit: {
        message: string;
        author: {
            name?: string;
            date?: string;
            email?: string;
        } | null;
    };
    files?: Array<{
        filename: string;
        additions: number;
        deletions: number;
        changes: number;
    }>;
}

// Standup - daily standup notes with GitHub commits
export interface Standup {
    id: string;
    date: string;
    workCompleted: string;  // Renamed from 'yesterday'
    workPlanned: string;    // Renamed from 'today'
    blockers: string;
    taskIds: string[];
    commits: GitHubCommit[];
    repoFullName?: string;
    createdAt: string;
    updatedAt?: string;
}

// Milestone - long-term goals (renamed from Goal)
export interface Milestone {
    id: string;
    userId?: string;
    title: string;
    description: string;
    targetDate?: string;
    status: 'active' | 'completed' | 'archived';
    totalPoints?: number;
    completedPoints?: number;
    completedAt?: string;
    createdAt: string;
    updatedAt?: string;
}

// Sprint - time-boxed work periods
export interface Sprint {
    id: string;
    userId?: string;
    milestoneId?: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'planned' | 'active' | 'completed';
    targetPoints?: number;
    completedPoints?: number;
    completedAt?: string;
    createdAt: string;
    updatedAt?: string;
}

// Task - individual work items with story points
export interface Task {
    id: string;
    userId?: string;
    sprintId?: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    storyPoints?: number;
    storyPointSystem?: 'fibonacci' | 'tshirt' | 'linear';
    // External integration support (future: Jira/Asana/Linear)
    externalId?: string;
    externalSource?: 'jira' | 'asana' | 'linear';
    externalUrl?: string;
    externalData?: Record<string, unknown>;
    targetDate?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt?: string;
}

// Legacy Goal type (deprecated, use Milestone instead)
/** @deprecated Use Milestone instead */
export interface Goal {
    id: string;
    title: string;
    description: string;
    targetDate?: string;
    createdAt: string;
    completedAt?: string;
}

export interface AppState {
    user: GitHubUser | null;
    accessToken: string | null;
    selectedRepo: GitHubRepo | null;
    standups: Standup[];
    milestones: Milestone[];
    sprints: Sprint[];
    tasks: Task[];
}
