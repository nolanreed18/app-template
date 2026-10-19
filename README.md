# App template

The blueprint for my personal apps: a Streamlit app on Streamlit Community
Cloud, a Neon Postgres database, a public GitHub repository with CI and
encrypted weekly backups, and Claude Code cloud sessions doing the building.
The Career Tracker is the first app built this way; every new one starts
here.

## Starting a new app

1. Open a Claude Code cloud session on this repository and type
   `/new-app` followed by a few words about the app ("habit tracker").
2. Answer its questions. It writes three files under `apps/<name>/`:
   `START_HERE.md` (the kickoff prompt), `SPEC.md` (what the app does) and
   `CHECKLIST.md` (the steps only you can do), and opens a pull request.
3. Merge it, then follow `CHECKLIST.md`: create the repository, the cloud
   environment, the Neon project and the secrets, start a session on the new
   repository and paste `START_HERE.md` as its first message.

## What's here

| Path | What it is |
|---|---|
| `BLUEPRINT.md` | The architecture and the rules every app follows. The single source of truth; a new app's CLAUDE.md is made from it. |
| `KICKOFF_TEMPLATE.md` | The kickoff prompt with blanks that `/new-app` fills in. |
| `CHECKLIST.md` | The human steps for any new app, with blanks. |
| `template/` | Files every app copies as they are (database helper, theme, module-freshness guard, backup, test fixtures, CI, hooks, lint and Python pins). |
| `reference/` | Career Tracker files showing the pattern for the parts each app writes itself (UI helpers, data and logic modules, a page, the schema, the tests, README, CLAUDE.md). |
| `apps/` | One folder per app started from here, with its kickoff prompt, spec and checklist. |
| `.claude/skills/new-app/` | The `/new-app` skill. |

## Keeping it current

When a generic file improves in one of the apps (the theme, the sign-in,
the backup script, the CI workflow), port the change here in a pull request
so the next app gets it. `CLAUDE.md` tells a session on this repository how.
