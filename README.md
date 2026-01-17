# StandUp Tracker

Never forget what you were working on yesterday.

StandUp Tracker helps developers track daily progress effortlessly by automatically pulling GitHub commits to create standup notes in seconds. Perfect for async teams and individuals who want to stay organized without disrupting workflow.

![StandUp Tracker](./src/assets/Standup-Tracker.png)

## Why StandUp Tracker?

Daily standups are essential for team alignment but can disrupt focus and be challenging across timezones. StandUp Tracker provides an asynchronous alternative that:

- **Saves time** - Create updates in seconds instead of attending meetings
- **Preserves focus** - No context-switching during deep work sessions
- **Works globally** - Perfect for distributed teams across timezones
- **Tracks real work** - Based on actual commits, not memory

## Features

- **Auto-populate from Git** - Your commits become your standup notes with one click
- **Async by default** - Write updates on your schedule, not meeting schedules
- **Link to SMART goals** - Connect daily work to bigger objectives and track progress
- **Team visibility** (Coming soon) - Share progress updates without meetings
- **Learn your velocity** (Coming soon) - Predict story points based on your actual work patterns
- **Dark mode by default** - Easy on the eyes with light mode option
- **Secure OAuth** - GitHub authentication with token encryption

## Demo

[Live Demo](https://your-deployment-url.vercel.app) (Will add after deployment)

## Tech Stack

### Frontend

- **React 18** + **TypeScript** - Type-safe component architecture
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Beautiful, accessible components
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing

### Backend

- **Vercel Serverless Functions** - OAuth token exchange
- **GitHub API (Octokit)** - Repository and commit data

### DevOps

- **Vercel** - Deployment and hosting
- **GitHub OAuth Apps** - Secure authentication

## Installation

### Prerequisites

- Node.js 18+ and npm
- GitHub account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**

```bash
   git clone https://github.com/RBazelais/Standup-Tracker.git
   cd Standup-Tracker
```

1. **Install dependencies**

```bash
   npm install
```

1. **Set up GitHub OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in:
     - **Application name:** StandUp Tracker Local Dev
     - **Homepage URL:** `http://localhost:3000`
     - **Authorization callback URL:** `http://localhost:3000/auth/callback`
   - Copy your **Client ID** and **Client Secret**

2. **Configure environment variables**

```bash
   cp .env.example .env
```

   Update `.env` with your credentials:

```env
   VITE_GITHUB_CLIENT_ID=your_client_id_here
   VITE_APP_URL=http://localhost:3000
   GITHUB_CLIENT_SECRET=your_client_secret_here
```

1. **Run the development server**

```bash
   npm install -g vercel  # Install Vercel CLI
   vercel dev             # Run with serverless functions
```

1. **Open your browser**
   Navigate to `http://localhost:3000`

## Deployment

### Deploy to Vercel

1. **Push to GitHub**

```bash
   git push origin main
```

1. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_GITHUB_CLIENT_ID`
     - `VITE_APP_URL` (your Vercel URL)
     - `GITHUB_CLIENT_SECRET`

2. **Update GitHub OAuth App**
   - Update callback URL to: `https://your-app.vercel.app/auth/callback`

3. **Deploy**
   Vercel will automatically deploy on every push to `main`

## Usage

1. **Sign in with GitHub** - Authorize StandUp Tracker to access your repositories
2. **Select a repository** - Choose which project you want to track
3. **Create standups** (Coming soon) - Auto-populate from your commits or write manually
4. **Link to goals** (Coming soon) - Connect updates to your SMART goals
5. **Share with team** (Coming soon) - Post updates asynchronously
6. **Track velocity** (Coming soon) - Learn your estimation patterns over time

## Roadmap

### Phase 1: Core Features

- [x] Landing page with dark mode
- [x] GitHub OAuth authentication
- [x] Repository selection
- [ ] Standup form with commit auto-population
- [ ] Standup history view
- [ ] SMART goals management
- [ ] Link standups to goals

### Phase 2: Team Collaboration

- [ ] Team workspaces
- [ ] Share standups asynchronously
- [ ] Team dashboard view
- [ ] Notifications (Slack/Discord/Email)

### Phase 3: Advanced Features

- [ ] Story point prediction (ML-based)
- [ ] Velocity tracking and insights
- [ ] Blocker detection
- [ ] Sprint retrospective summaries

### Phase 4: Integrations

- [ ] Export standups to Markdown
- [ ] Jira/Linear integration
- [ ] Calendar integration
- [ ] API for custom workflows

## Our Approach

StandUp Tracker is built on the belief that effective communication should enhance productivity, not hinder it. While meetings have their place for collaboration and discussion, routine status updates can often be handled asynchronously.

This tool helps teams:

- Maintain visibility without constant meetings
- Respect different working styles and timezones
- Focus on outcomes rather than attendance
- Create searchable records of progress

## Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation, we appreciate your help.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Rachél Bazelais**

- Portfolio: [rbazelais.com](https://rbazelais.com)
- GitHub: [@RBazelais](https://github.com/RBazelais)
- LinkedIn: [rbazelais](https://linkedin.com/in/rbazelais)

## Acknowledgments

- Built for developers who value focused work time
- Inspired by distributed teams seeking better async communication
- Special thanks to the React and Vercel communities

---

If you find StandUp Tracker helpful for your workflow, please consider giving it a star!
