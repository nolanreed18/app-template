# Blueprint: how every app is built

One person's apps, each small, each the same shape, so that building the
next one is mostly copying and the rules never need re-learning.

## The stack

| Piece | Choice | Why |
|---|---|---|
| App | Streamlit (Python 3.13), one `app/Home.py` plus `app/pages/*.py` | Pages are plain Python; the look is one theme file. |
| Hosting | Streamlit Community Cloud, deployed from `main` | Free, redeploys on merge. One private app per account; the rest public. |
| Database | Neon Postgres, one project per app | Free tier, HTTPS endpoint for cloud sessions, branches for experiments. |
| Code | GitHub, public repository, branch + pull request for every change | CI runs lint and tests on every PR; the session merges its own PR once CI is green. |
| Backups | GitHub Actions weekly, every table to CSV inside a password-locked 7z | The artifact is public to signed-in GitHub users, so it must be encrypted. |
| Building | Claude Code cloud sessions, one per task, each ending in a PR | Sessions start a throwaway Postgres for tests; they never touch the real database. |
| Sign-in | Google (`st.login`, emails in `ALLOWED_EMAILS`) or `APP_PASSWORD` | Every page behind it; locked when neither is set. |

## Files every app has

```
app/
  Home.py            what needs attention, the headline numbers, quick actions
  pages/N_Name.py    one page per screen; the number orders the menu
  config.py          knobs and lists (also enforced by schema CHECKs)
  data.py            every database read and write; nothing else runs SQL
  logic.py           calculations: pure, no database, no Streamlit
  ui.py              setup(): page config, sign-in, theme; cards, badges, helpers
  theme.py           light + dark palettes, fonts, the stylesheet
  fresh.py           reloads app modules after a redeploy (no stale imports)
db.py                finds DATABASE_URL (.env locally, secrets on Cloud); HTTPS cursor for cloud sessions
schema.sql           every table, re-runnable (if not exists)
apply_schema.py      creates the tables by hand (the app does it itself on first connection)
backup.py            dumps every table to CSV
conftest.py, tests/  the test harness and the tests
.github/workflows/   tests.yml (lint + tests on PRs), backup.yml (weekly)
.claude/             session-start hook (deps + throwaway Postgres), settings, skills
.streamlit/config.toml  the light theme, for first paint
CLAUDE.md            the rules below, in the app's own words
README.md            what it does, first-time setup, Google sign-in, running locally, backups, tests
```

## The rules

- `.env` holds `DATABASE_URL`. Never read, print or copy it; use `db.py`.
- The repository and app are public. `ui.setup()` puts every page behind the
  sign-in and the app stays locked when neither way in is set up. Never
  commit data or secrets; `data/` and `*.csv` are gitignored. Backups go
  only inside a 7z locked with `BACKUP_PASSWORD`.
- Never `current_date`, `now()` or the server timezone in SQL: "today" is
  `data.today()` (America/Chicago), passed in. Dates are plain dates. Money,
  if any, is `numeric(12,2)` in Postgres and `Decimal` in Python.
- All SQL lives in `app/data.py`; calculations in `app/logic.py` (pure).
  Pages only lay out and call those two.
- The look lives in `app/theme.py` (described in DESIGN.md): light (default) and dark palettes
  applied per run from the `settings` table, plus one stylesheet;
  `.streamlit/config.toml` equals the light palette (a test checks). Pages
  use `ui.card()`, `ui.empty()` and the badge helpers, never emoji or raw
  HTML; colour means something (blue = in progress, green = good, orange =
  attention, red = overdue or bad, grey = neutral, yellow = unverified).
  Sub-pages are `ui.sections()` pills, never `st.tabs`; every delete goes
  through `ui.delete_button()`; a pick-one dropdown whose options can
  change takes `ui.round_key()` and `ui.bump_round()` after a delete.
- Knobs in `app/config.py`. Lists the schema enforces are repeated in
  `schema.sql` CHECKs; a test fails if they drift. Add a table → add it to
  `backup.TABLES` and the `TABLES` list in `conftest.py`.
- `schema.sql` stays re-runnable; changing an existing table also adds an
  idempotent statement to `data.MIGRATIONS`, so the live database updates
  itself on the next connection.
- Add forms sit behind `ui.disclosure()` buttons, not `st.expander`.
- Every page's first statement after `import streamlit` is `fresh.check()`.
- Pass plain Python values to psycopg, not numpy. User text goes into
  `st.markdown` through `ui.md()`.
- Forms reset by bumping a counter in their key; set a widget's session
  state only before it is drawn.
- `ruff check .` and `pytest` before every push. Page tests use
  `streamlit.testing.v1.AppTest` against the throwaway database with
  `data.today` patched; every page gets a draws-empty and a
  draws-with-data test. Work on a branch; `main` is what's live.
- A scheduled Claude task (like the Career Tracker's daily review) reaches
  the database only through one small script over Neon's HTTPS endpoint,
  with its commands allow-listed in `.claude/settings.json`, and any email
  it sends is rendered by code, not written by the model.

## Shape of a spec

A spec names the pages in sidebar order and what each shows and does; the
tables with their columns and the lists the schema enforces; what Home
flags as needing attention; the maths (in words) that `logic.py` must get
right; imports, if any, and their dedupe rule; and a "later, not now" list.
`apps/finance-tracker/SPEC.md` is the model.
