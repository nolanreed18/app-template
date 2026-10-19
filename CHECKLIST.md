# Checklist for a new app: {{APP_NAME}}

These are the steps only you can do, in order. Each takes a few minutes.

1. **Create the repository** `nolanreed18/{{REPO}}` on GitHub: public,
   empty (no README, no .gitignore: the template brings both).
2. **Let Claude reach it**: at
   https://github.com/apps/claude/installations/select_target add the new
   repository to the Claude GitHub App, then confirm it appears when you
   start a session at https://claude.ai/code.
3. **Create a cloud environment** for it (claude.ai/code → environment menu
   → New): name `{{REPO}}`, network **Limited**, allowed domains
   `*.neon.tech` only, and **no `DATABASE_URL` variable**. An environment
   carrying another app's `DATABASE_URL` could point a session at the wrong
   database. Build sessions don't need a database: they test against a
   throwaway Postgres the session hook starts.
4. **Create the Neon project** `{{REPO}}`: a new project, never a branch of
   another app's. Copy its connection string; treat it as a password.
5. **Add the repository secrets** (GitHub → Settings → Secrets and
   variables → Actions): `DATABASE_URL` (the Neon string) and
   `BACKUP_PASSWORD` (a new long password kept in your password manager).
6. **Start a cloud session** on `nolanreed18/{{REPO}}` in the `{{REPO}}`
   environment and paste `apps/{{REPO}}/START_HERE.md` as the first
   message. Merge each pull request when its check is green.
7. **Deploy** after the first merge: share.streamlit.io → Create app → repo
   `nolanreed18/{{REPO}}`, branch `main`, main file `app/Home.py`, Python
   3.13, secrets `DATABASE_URL` and `APP_PASSWORD`. Streamlit's free plan
   allows one private app; the rest are public behind the sign-in wall.
8. **Sign in with Google**: add the new app's
   `https://<app>.streamlit.app/oauth2callback` as another redirect URI on
   the existing Google client, and add the `[auth]` block and
   `ALLOWED_EMAILS` to the app's secrets, as the Career Tracker README shows.
9. **Test the backup**: GitHub → Actions → Backup → Run workflow; green
   means the encrypted copy worked.
