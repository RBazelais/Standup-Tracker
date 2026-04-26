-- Add Jira OAuth token fields to integrations table.
-- refresh_token: used to silently obtain a new access_token after it expires (1hr).
-- token_expires_at: lets us refresh proactively before the token expires mid-request.
-- metadata: jsonb for provider-specific data e.g. { cloudId, siteName } for Jira.

ALTER TABLE "integrations" ADD COLUMN "refresh_token" text;
--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "token_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "integrations" ADD COLUMN "metadata" jsonb;
