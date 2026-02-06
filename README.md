# StandUp Tracker

> Auto-generate standup notes from GitHub commits with smart selection and instant feedback

Never forget what you were working on yesterday. Your commits already know.

Built for async teams, remote developers, and people who respect each other's time.

**[Live Demo](https://standup-tracker-indol.vercel.app)** • **[Portfolio](https://rbazelais.com)**

![StandUp Tracker](./src/assets/Standup-Tracker.png)

---

## Features

- [X] **Smart commit selection** - Day grouping, branch filtering, bulk operations
- [X] **Optimistic UI** - Instant feedback with automatic rollback on errors
- [X] **Async by default** - Write updates on your schedule, not meeting schedules
- [X] **Hierarchical planning** - Milestones → Sprints → Tasks → Standups
- [X] **Full CRUD** - Create, view, edit, delete with toast notifications
- [X] **Markdown support** - Format notes with markdown for readability
- [X] **Secure OAuth** - GitHub authentication with encrypted tokens
- [X] **Database persistence** - Neon Postgres with type-safe queries

---

## Tech Stack

### Frontend

- **React 18 + TypeScript** - Type-safe component architecture
- **Vite** - Lightning-fast build tool
- **React Query (TanStack Query)** - Server state management with optimistic updates
- **Zustand** - Client state management (auth, UI selections)
- **Tailwind CSS** - Utility-first styling with semantic color tokens
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing

### Backend

- **Vercel Serverless Functions** - RESTful API endpoints
- **Neon Postgres** - Serverless PostgreSQL database
- **Drizzle ORM** - Type-safe SQL queries
- **GitHub API (Octokit)** - Repository and commit data

### DevOps

- **Vercel** - Deployment and hosting
- **GitHub OAuth** - Secure authentication flow

---

## Architecture

### State Management Strategy

Separated client state from server state for optimal performance and developer experience:

**Zustand (Client State - 1KB):**

- Auth tokens and user session (persisted to localStorage)
- UI selections (selected repo, branch)
- Synchronous, always available

**React Query (Server State - 13KB):**

- Standups, commits, branches (fetched from API)
- Automatic caching and background sync
- Optimistic updates with automatic rollback
- Built-in error handling and retries

**Trade-off:** Added 14KB bundle size but eliminated ~200 lines of manual cache invalidation, optimistic update logic, and error handling per resource.

### Database Schema

```typescript
// Core schema
standups
├── id (uuid)
├── user_id (text)
├── work_completed (text)  ← Renamed from 'yesterday'
├── work_planned (text)    ← Renamed from 'today'
├── blockers (text)
├── commits (jsonb)
├── task_ids (jsonb)
└── timestamps

// Phase 2: Hierarchical planning
milestones (long-term goals)
  ↓
sprints (time-boxed iterations)
  ↓
tasks (individual work items)
  ↓
standups (daily updates)
```

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/standups?userId={id}` | Fetch all standups for user |
| POST | `/api/standups?userId={id}` | Create new standup |
| GET | `/api/standups/{id}` | Fetch single standup |
| PUT | `/api/standups/{id}` | Update standup |
| DELETE | `/api/standups/{id}` | Delete standup |

---

## Technical Challenges

### 1. State Management Architecture

**Problem:** Initial Zustand implementation required ~200 lines of manual cache invalidation, optimistic update logic, and error handling per resource. Manual rollback on failed mutations was error-prone and could cause race conditions.

**Solution:**

1. Created centralized API service layer (`src/services/api.ts`)
2. Built `useStandups` hook with React Query mutations
3. Implemented optimistic updates with automatic rollback
4. Separated concerns: Zustand for auth/UI, React Query for server data

**Code Example:**

```typescript

// Before: Manual optimistic updates in Zustand (error-prone)
const addStandup = async (standup) => {
  set({ standups: [standup, ...state.standups] }); // Optimistic
  try {
    const response = await fetch('/api/standups', { ... });
    if (!response.ok) {
      // Manual rollback
      set({ standups: state.standups.filter(s => s.id !== standup.id) });
    }
  } catch (error) {
    // Manual error handling
  }
};

// After: Automatic with React Query
const createMutation = useMutation({
  mutationFn: standupsApi.create,
  onMutate: async (newStandup) => {
    queryClient.setQueryData(['standups'], old => [newStandup, ...old]);
    return { previousStandups };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['standups'], context.previousStandups); // Auto rollback
    toast.error('Failed to create standup');
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['standups']); // Auto cache refresh
    toast.success('Standup created!');
  }
});
```

**Result:** Eliminated boilerplate, prevented race conditions, improved UX with instant feedback.

---

### 2. Commit Selection UX

**Problem:** Raw commit lists (50+ commits for a week) overwhelmed users with noise. Needed intuitive filtering across multiple days and branches without complex UI.

**Solution:**

1. Grouped commits by day using Accordion component
2. Added individual + bulk selection controls per day
3. Implemented branch-specific filtering
4. Auto-select all commits on load (user deselects noise)
5. Visual feedback with selection counter

**Result:** Users can quickly review and curate commits in ~10 seconds vs. manual typing for 5+ minutes.

---

### 3. Database Schema Evolution

**Problem:** Initial schema used confusing field names (`yesterday`, `today`). Needed to rename fields and add Phase 2 tables (milestones, sprints, tasks) without breaking production.

**Solution:**

1. Wrote migration script to safely rename columns
2. Migrated existing data from old → new columns
3. Added NOT NULL constraints after data migration
4. Dropped old columns
5. Created Phase 2 tables with proper foreign keys

**Migration Script:**

```javascript
// Add new columns
ALTER TABLE standups 
  ADD COLUMN work_completed TEXT,
  ADD COLUMN work_planned TEXT;

// Copy data
UPDATE standups 
SET work_completed = yesterday, work_planned = today;

// Drop old columns
ALTER TABLE standups 
  DROP COLUMN yesterday, DROP COLUMN today;
```

**Result:** Zero downtime migration with referential integrity maintained.

---

## Installation

### Prerequisites

- Node.js 18+ and npm
- GitHub account for OAuth
- Vercel account (for deployment)

### Local Development

1. **Clone and install**

```bash
git clone https://github.com/RBazelais/Standup-Tracker.git
cd Standup-Tracker
npm install
```

2. **Set up GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Create new OAuth App:
     - **Homepage URL:** `http://localhost:3000`
     - **Callback URL:** `http://localhost:3000/auth/callback`
   - Copy Client ID and Secret

3. **Set up Neon Database**
   - Create project at [neon.tech](https://neon.tech)
   - Copy connection string

4. **Configure environment variables**

Create `.env.local`:
```env
# GitHub OAuth
VITE_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
VITE_APP_URL=http://localhost:3000

# Database
POSTGRES_URL=your_neon_connection_string
```

5. **Run database migrations**
```bash
npm run db:push
```

6. **Start development server**
```bash
npm install -g vercel  # Install Vercel CLI
vercel dev             # Run with serverless functions
```

7. **Open browser** → `http://localhost:3000`

---

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import repository to Vercel
3. Add environment variables (Vercel auto-detects Neon)
4. Update GitHub OAuth callback URL to production URL
5. Deploy (automatic on every push)

---

## Usage

1. **Sign in with GitHub** - Authorize repository access
2. **Select repository** - Choose project to track
3. **Select branch** (optional) - Filter commits by branch
4. **Create standup**:
   - Select date range (presets: Yesterday, Last Friday, This Week)
   - Review commits grouped by day
   - Deselect noise commits
   - Click "Auto-populate" to fill work completed
   - Add plans and blockers
5. **View history** - Browse past standups
6. **Edit/delete** - Click any standup for details

---

## Roadmap

### Phase 1: Core Features

- [x] GitHub OAuth authentication
- [x] Smart commit selection with day grouping
- [x] Branch filtering
- [x] Optimistic UI with React Query
- [x] Database persistence
- [x] Full CRUD operations

### Phase 2: Task Management (In Progress)

- [x] Database schema with milestones/sprints/tasks
- [ ] Link standups to tasks
- [ ] Story point tracking
- [ ] Sprint velocity insights

### Future Ideas

- [ ] AI commit summarization (Claude API)
- [ ] Slack/Discord integration
- [ ] Jira/Linear sync
- [ ] Export as Markdown
- [ ] Weekly summary reports

---

## Contributing

Contributions welcome! Fork, create a feature branch, and open a PR.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Author

**Rachél Bazelais**  
Frontend Engineer specializing in React, TypeScript, and UI engineering

- 🌐 [rbazelais.com](https://rbazelais.com)
- 💼 [LinkedIn](https://linkedin.com/in/rbazelais)
- 🐙 [GitHub](https://github.com/RBazelais)