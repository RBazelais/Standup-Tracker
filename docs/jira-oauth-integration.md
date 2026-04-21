# Jira OAuth Integration

## Platform decision

I evaluated Nango (nango.dev) as a managed OAuth layer for all third-party integrations (Jira, Linear, Slack, Notion). Nango handles token exchange, refresh, and storage for 700+ APIs and would eliminate per-provider boilerplate.

I chose to build OAuth flows manually instead. Owning the implementation means understanding the full OAuth 2.0 3LO flow, token storage, refresh rotation, and provider-specific behaviour. Each integration we build from scratch deepens that understanding in a way a third-party SDK cannot.

## OAuth 2.0 three-legged (3LO) flow

### Flowchart

[![OAuth flowchart](https://mermaid.ink/img/pako:eNqNU11P4kAU_SuT2WSjCZRSqGIT18iHiqKi6MNuMWRsb6FLmWlmprsq4b_vnaFg980-UKb3nHPP_Zg1jUQMNKBJJv5GCyY1eepPOcHn_CB8ViBJlKXRUpGe4BwiTa5TyV4OSb3-g3TDy8ETabBCLxq_zectsWuDvbBbpFlMTFTI9IPpVHDy_DiaTjlKAtezNK4RFYkc8KWZxpeEOJWYZVbItFTrWbV-ONFCwhZHUk4UKIWCJahvQYPwseQTLWxih-mMIZBxJxIrBG_hAwu_WNv6WJ5L8QfU2WYbvMAguRMWcln2QAEoAlIKSXI2h5fDCvQnhgz2KjzfJdvXodAI1vvZokbEsuyVRcsz0_fT827vuy3p1HGcvb0rqzdcT2yxK6ajBSiUKWveGR1WjF4fYO26kJy03RZCxwKhrxmQ3uTxgjCtMeXO9bDq-iYc309wiMJa1GIJHOnwhrvA50CMS5Jg2Tai9hZvLHm0HpRA466IIjSYFNnO4Khi8HZv8LONSGJqSQrTYRyYBC3fdyZHVZN35aLZBKasugQlChnZtiSADcI1FUU8jPcO7yzzPnzOUV7jymAG_IG5tJuIk2EoZCxY1Zkt0GxggtqL8mhbkeMo1YzpWiWHyXBvM4z_W7qGAq1TPlc4X3tfID6tXI2xpTxUt8rcJ7IHowZT2jRhS1D6HYd4TZI0y4JvkLTxqUUiEzL4liRJFXT5FdDtV0APJcjzIt-HCojW6FymMQ20LKBGVyBXzBzp2tCnVC9gBVMa4N-YyeWUTvkGOTnjv4RY7WhSFPMFDRKWKTwVeYxb3k8ZDma1_yqBxyB7ouCaBq1my4rQYE3faFBvtk-czonvuu1m0z1y3c5xjb7j93ar43R8t-m33I7rt459f1OjHzaz53geEvwjz2t3vHbzZPMPb7CZFg)](https://mermaid.live/edit#pako:eNqNU11P4kAU_SuT2WSjCZRSqGIT18iHiqKi6MNuMWRsb6FLmWlmprsq4b_vnaFg980-UKb3nHPP_Zg1jUQMNKBJJv5GCyY1eepPOcHn_CB8ViBJlKXRUpGe4BwiTa5TyV4OSb3-g3TDy8ETabBCLxq_zectsWuDvbBbpFlMTFTI9IPpVHDy_DiaTjlKAtezNK4RFYkc8KWZxpeEOJWYZVbItFTrWbV-ONFCwhZHUk4UKIWCJahvQYPwseQTLWxih-mMIZBxJxIrBG_hAwu_WNv6WJ5L8QfU2WYbvMAguRMWcln2QAEoAlIKSXI2h5fDCvQnhgz2KjzfJdvXodAI1vvZokbEsuyVRcsz0_fT827vuy3p1HGcvb0rqzdcT2yxK6ajBSiUKWveGR1WjF4fYO26kJy03RZCxwKhrxmQ3uTxgjCtMeXO9bDq-iYc309wiMJa1GIJHOnwhrvA50CMS5Jg2Tai9hZvLHm0HpRA466IIjSYFNnO4Khi8HZv8LONSGJqSQrTYRyYBC3fdyZHVZN35aLZBKasugQlChnZtiSADcI1FUU8jPcO7yzzPnzOUV7jymAG_IG5tJuIk2EoZCxY1Zkt0GxggtqL8mhbkeMo1YzpWiWHyXBvM4z_W7qGAq1TPlc4X3tfID6tXI2xpTxUt8rcJ7IHowZT2jRhS1D6HYd4TZI0y4JvkLTxqUUiEzL4liRJFXT5FdDtV0APJcjzIt-HCojW6FymMQ20LKBGVyBXzBzp2tCnVC9gBVMa4N-YyeWUTvkGOTnjv4RY7WhSFPMFDRKWKTwVeYxb3k8ZDma1_yqBxyB7ouCaBq1my4rQYE3faFBvtk-czonvuu1m0z1y3c5xjb7j93ar43R8t-m33I7rt459f1OjHzaz53geEvwjz2t3vHbzZPMPb7CZFg)

### Sequence diagram

[![OAuth sequence diagram](https://mermaid.ink/img/pako:eNqNVG1P2zAQ_iuWP0yghSR9SVsiwVS6FzFNA42xD1smZJyj9Zrame2ssKr_fee8EShM9EN1zt0999w9Z28oVynQmBr4XYDk8FawuWarRBL8MW6VJpcGdHXOmbaCi5xJS060Wj_pOCv0NM8JM84iztz7BppDtr8bO7UZM0Ywuev6KDSbnp86HGcStJM6zBE6OD6uGcRklgm-JAmdKSmBV6kJrWLrIAyveMXkw7uvJGCFXQS_XFwZVfm6mF8gFdqBWUVcsM8aqj5Xqzc8EyDtlUiPfN9_ZbjKobIss6X1uHrbaUzeqyxTa6LrClVk68fYy5LBxQKDuJIGCxHDNcDD9juIyF2rP7CL9GQ7980HnGXZNePLN24LjqYns-cbeHp8uwiNSO1IOzzPzy4wWZXZVi1Bkj2X5pF2nK1pADu2-7stNTwY52DMVQnj4TBvNJhFc4TbHNs1V0L-j07ZSodNUGGK6wwOMFsVuLXmeQY_NkSkMRJWRXqKzAudxcQIC2T7c6dsk3SZ4zidDFjPkNdNNhESlcE_wNtnBapOLEMeL1nPwIC1Qs4NalBeAEiP7lf7XsHOWiW0vFNtfEIRiBnb0P6ssAvcKF2X9urbGJNPuB7aI-sFimfuJMe6xOQamZt2aV4o_QPN9om4qWVLnx-5hPUD4R_Va1mWyiK4DdhcZBD0_DC4VkynZO8EmMa-uij1ltXZnXJlilOp7jCR1KNzLVIaW12AR1egV8wd6cZhJNQuYAUJjdFMmV66V2iLOfiifVdq1aRpVcwXNL5hmcFTkac41Prhbb9qkCnomSqkpfGgNy5BaLyhtzQ-6A0P_clhFIbDXi8cheEE3Xf4fTiY-JMo7EWDcBJGg3EUbT36t6zc9_t9TIhG_dFoPBmOxtt_hu4ApQ)](https://mermaid.live/edit#pako:eNqNVG1P2zAQ_iuWP0yghSR9SVsiwVS6FzFNA42xD1smZJyj9Zrame2ssKr_fee8EShM9EN1zt0999w9Z28oVynQmBr4XYDk8FawuWarRBL8MW6VJpcGdHXOmbaCi5xJS060Wj_pOCv0NM8JM84iztz7BppDtr8bO7UZM0Ywuev6KDSbnp86HGcStJM6zBE6OD6uGcRklgm-JAmdKSmBV6kJrWLrIAyveMXkw7uvJGCFXQS_XFwZVfm6mF8gFdqBWUVcsM8aqj5Xqzc8EyDtlUiPfN9_ZbjKobIss6X1uHrbaUzeqyxTa6LrClVk68fYy5LBxQKDuJIGCxHDNcDD9juIyF2rP7CL9GQ7980HnGXZNePLN24LjqYns-cbeHp8uwiNSO1IOzzPzy4wWZXZVi1Bkj2X5pF2nK1pADu2-7stNTwY52DMVQnj4TBvNJhFc4TbHNs1V0L-j07ZSodNUGGK6wwOMFsVuLXmeQY_NkSkMRJWRXqKzAudxcQIC2T7c6dsk3SZ4zidDFjPkNdNNhESlcE_wNtnBapOLEMeL1nPwIC1Qs4NalBeAEiP7lf7XsHOWiW0vFNtfEIRiBnb0P6ssAvcKF2X9urbGJNPuB7aI-sFimfuJMe6xOQamZt2aV4o_QPN9om4qWVLnx-5hPUD4R_Va1mWyiK4DdhcZBD0_DC4VkynZO8EmMa-uij1ltXZnXJlilOp7jCR1KNzLVIaW12AR1egV8wd6cZhJNQuYAUJjdFMmV66V2iLOfiifVdq1aRpVcwXNL5hmcFTkac41Prhbb9qkCnomSqkpfGgNy5BaLyhtzQ-6A0P_clhFIbDXi8cheEE3Xf4fTiY-JMo7EWDcBJGg3EUbT36t6zc9_t9TIhG_dFoPBmOxtt_hu4ApQ)

## Key steps

1. `GET /auth/jira` builds the Atlassian authorization URL with `client_id`, `scope`, `state`, `redirect_uri` and redirects the user
2. User approves on Atlassian's consent screen
3. `GET /auth/jira/callback?code=ABC&state=...` validates state, exchanges code for tokens
4. `POST https://auth.atlassian.com/oauth/token` returns `access_token`, `refresh_token`, `expires_in`
5. `GET https://api.atlassian.com/oauth/token/accessible-resources` returns `cloudId` for the user's Jira site
6. Upsert tokens and `cloudId` into the `integrations` table
7. Redirect to `/settings?connected=jira`

## State parameter

The `state` parameter is a random value generated before the redirect, stored in the session, and verified when the callback arrives. It prevents CSRF attacks where a third party tricks the app into completing an OAuth flow it did not initiate. Always validate it before doing anything else in the callback.

## Required Atlassian app scopes

- `read:jira-work` reads issues, sprints, boards
- `read:jira-user` reads user profile
- `offline_access` enables the refresh token (without this the token expires in 1 hour with no way to renew)

## New integrations table columns needed

The existing `integrations` table stores `access_token` and `account_name`. Jira OAuth also needs:

- `refresh_token` used to obtain a new access token when the current one expires
- `token_expires_at` timestamp so we know when to refresh proactively
- `metadata` (jsonb) stores `cloudId` and `siteName` for the Jira tenant

## Scripts

All Jira seed and maintenance scripts live in `scripts/jira/`:

| Script | Purpose |
| --- | --- |
| `seed-jira.mjs` | Creates project STUP, epic, 3 sprints, 18 stories |
| `seed-jira-backlog.mjs` | Adds 20 unassigned backlog stories |
| `update-jira-subtasks.mjs` | Adds subtasks and story points to all stories |
| `update-jira-descriptions.mjs` | Adds descriptions to completed parent stories |
| `update-jira-subtask-descriptions.mjs` | Adds descriptions with dates to completed subtasks |
| `update-jira-upcoming-descriptions.mjs` | Adds descriptions to upcoming and backlog issues |
| `close-jira-issues.mjs` | Transitions completed issues to Done status |

## What is OAuth 2.0 3LO?

OAuth 2.0 is an authorization framework. It lets a user grant a third-party app access to their account on another service without giving that app their password.

Three-legged (3LO) refers to the three parties involved:

1. The user (the person clicking "Connect Jira")
2. Our app (StandupTracker, the one requesting access)
3. Atlassian (the one holding the user's data and issuing the tokens)

The "legs" are the three handshakes between them:

```
Leg 1: User → Atlassian     "I authorize StandupTracker to read my Jira data"
Leg 2: Atlassian → Our App  "Here is a one-time code proving the user said yes"
Leg 3: Our App → Atlassian  "Exchange this code for a real access token"
```

### Why three legs and not two?

Two-legged OAuth (2LO) is machine-to-machine. Our app talks directly to Atlassian using its own credentials and there is no user involved. That is what the seed scripts use (API token = 2LO).

Three-legged OAuth adds the user in the middle because we want to act on behalf of a specific person, not just as our app. When we sync Rachel's sprints, we need Rachel's permission to read Rachel's Jira, not just a generic service account.

### The tokens

| Token | What it is | How long it lasts |
| --- | --- | --- |
| `code` | One-time proof the user approved. Never stored. | ~10 minutes |
| `access_token` | What we use to call the Jira API | 1 hour |
| `refresh_token` | Used to get a new access token without asking the user to approve again | Until revoked |

### Why store the refresh token?

Without it, after 1 hour the access token expires and the user has to go through the whole consent screen again. With it, we silently swap the expired access token for a fresh one in the background. The user never notices.

## XState for connection state management

The OAuth flow is a classic state machine. Each state has exactly one thing that can happen next, and errors from any step should land in the same error state.

```
idle → redirecting → waiting_for_callback → exchanging_tokens → fetching_cloud_id → storing → connected
                                                                                              ↓
                                                                                           error (from any state)
```

XState earns its place on the frontend (the Settings page connection status) and in the token refresh lifecycle. It is overkill for the API handlers, which are serverless functions that run once and exit.

### Why it helps

- No more `isLoading`, `isError`, `isConnected` boolean soup in the Settings component
- Impossible states become impossible in the type system (cannot be `isConnected` and `isError` simultaneously)
- The token refresh loop is also a state machine: `valid → refreshing → valid` or `→ disconnected`
- Every state is named and explicit, which makes the component easier to reason about and debug

### XState and Playwright work together naturally

XState makes states explicit and named, which gives Playwright concrete things to assert against. Every state in the machine becomes a test case. If the machine has 7 states there are 7 tests, and you cannot forget to cover one because the machine tells you what they all are.

```ts
// idle state
await expect(page.getByTestId('jira-status')).toHaveAttribute('data-state', 'idle')

// after connecting
await page.getByRole('button', { name: 'Connect Jira' }).click()
await expect(page.getByTestId('jira-status')).toHaveAttribute('data-state', 'connected')

// error state
await expect(page.getByTestId('jira-status')).toHaveAttribute('data-state', 'error')
await expect(page.getByText('Authorization failed')).toBeVisible()
```

Error states that are hard to trigger in a real browser become trivial to test by driving the machine directly into that state and asserting the UI matches.
