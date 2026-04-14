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
    default_branch: string;
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
    branch?: string; // Branch this commit was selected from
}

export type TaskStatus =
    | 'todo'
    | 'planned'
    | 'in_progress'
    | 'in_review'
    | 'done'
    | 'backlog'
    | 'blocked';

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type ExternalSource = 'github' | 'jira' | 'linear' | 'asana';

// Standup - daily standup notes with GitHub commits
export interface Standup {
    id: string;
    date: string; // YYYY-MM-DD calendar date, not a timestamp
    workCompleted: string;
    workPlanned: string;
    blockers: string;
    taskIds: string[];
    commits: GitHubCommit[];
    snapshotSprintId?: string;
    snapshotMilestoneId?: string;
    repoFullName?: string;
    createdAt: Date;
    updatedAt?: Date;
}

// Milestone - long-term goals (renamed from Goal)
export interface Milestone {
    id: string;
    userId?: string;
    title: string;
    description: string;
    targetDate?: string; // YYYY-MM-DD calendar date, not a timestamp
    status: 'active' | 'completed' | 'archived';
    totalPoints?: number;
    completedPoints?: number;
    completedAt?: Date;
    externalId?: string;
    externalSource?: ExternalSource;
    externalUrl?: string;
    lastSyncedAt?: Date;
    syncStatus?: 'synced' | 'stale' | 'error';
    createdAt: Date;
    updatedAt?: Date;
}

// Sprint - time-boxed work periods
export interface Sprint {
    id: string;
    userId?: string;
    milestoneId?: string;
    title: string;
    description: string;
    startDate: string; // YYYY-MM-DD calendar date, not a timestamp
    endDate: string;   // YYYY-MM-DD calendar date, not a timestamp
    status: 'planned' | 'active' | 'completed';
    targetPoints?: number;
    completedPoints?: number;
    completedAt?: Date;
    externalId?: string;
    externalSource?: ExternalSource;
    externalUrl?: string;
    lastSyncedAt?: Date;
    syncStatus?: 'synced' | 'stale' | 'error';
    createdAt: Date;
    updatedAt?: Date;
}

// Task - individual work items with story points
export interface Task {
    id: string;
    userId?: string;
    sprintId?: string;
    currentSprintId?: string;
    firstSprintId?: string | null;
    title: string;
    description: string;
    status: TaskStatus;
    priority?: TaskPriority;
    storyPoints?: number | null;
    storyPointSystem?: 'fibonacci' | 'tshirt' | 'linear';
    rolloverCount?: number;
    totalSprintsTouched?: number;
    // External integration support (future: Jira/Asana/Linear)
    externalId?: string;
    externalSource?: ExternalSource;
    externalUrl?: string;
    externalData?: Record<string, unknown>;
    externalLinks?: TaskExternalLink[];
    targetDate?: string; // YYYY-MM-DD calendar date, not a timestamp
    completedAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
}

export interface TaskExternalLink {
    taskId?: string;
    externalId: string;
    source: ExternalSource;
    externalUrl?: string;
    confidence: 'explicit' | 'inferred';
    linkedAt?: Date;
}

export interface ExternalTaskCache {
    externalId: string;
    source: ExternalSource;
    externalUrl?: string;
    title?: string;
    description?: string;
    status?: string;
    storyPoints?: number | null;
    priority?: TaskPriority;
    sprintExternalId?: string | null;
    rawData: unknown;
    syncedAt: Date;
}

export interface TaskChangeLog {
    id: string;
    taskId: string;
    fromSprintId?: string | null;
    toSprintId?: string | null;
    fromMilestoneId?: string | null;
    toMilestoneId?: string | null;
    changeType: 'created' | 'updated' | 'status_changed' | 'sprint_moved' | 'milestone_moved';
    changedAt: Date;
}

export interface Integration {
    id: string;
    userId: string;
    source: ExternalSource;
    accountName?: string;
    connectedAt: Date;
    updatedAt?: Date;
}

export type ExportFormat = 'compact' | 'detailed' | 'slack' | 'jira';

// Legacy Goal type (deprecated, use Milestone instead)
/** @deprecated Use Milestone instead */
export interface Goal {
    id: string;
    title: string;
    description: string;
    targetDate?: string; // YYYY-MM-DD calendar date, not a timestamp
    createdAt: Date;
    completedAt?: Date;
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
