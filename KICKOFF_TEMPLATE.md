# Kickoff prompt for {{APP_NAME}}

Paste everything below the line as the first message of a Claude Code cloud
session opened on the new, empty repository `nolanreed18/{{REPO}}`, in the
`{{REPO}}` cloud environment (see CHECKLIST.md).

---

You are building a new app for me from scratch in this empty repository:
{{ONE_LINE}}. It follows my app template, `nolanreed18/app-template`
(public on GitHub): the same architecture, tooling and conventions as my
other apps, sharing nothing with them at runtime (its own repository, Neon
database, Streamlit app and secrets). Read the template; never change it,
and never touch my other repositories.

About me: I'm new to GitHub and coding. Explain in plain language, do the
work yourself, and end every message with a short numbered list of anything
only I can do (accounts, secrets, clicking merge).

Safety first: this session must never use a real database. Tests run only
against `TEST_DATABASE_URL`, the throwaway Postgres the session hook starts.
If a `DATABASE_URL` variable exists in this environment, don't use it for
anything, and tell me: it would belong to another app.

## Step 1: copy the template

Attach `nolanreed18/app-template` with read access (the add_repo tool).
Copy everything under its `template/` folder into this repository as it is,
changing only the app's name where it appears. Read `BLUEPRINT.md` for the
rules and the file layout, `DESIGN.md` for how pages should look, and the files under `reference/` for the pattern
of the parts you write yourself: `app/ui.py` (keep the setup, sign-in,
appearance, card, empty, disclosure, sections, delete_button, round_key,
badge and md helpers; replace the app-specific badge tables), `app/data.py`
(keep the connection, migrations, cursors, readers, today(), settings;
replace the table functions), `app/logic.py` (keep blank, value,
for_display, plural, when, clock, money and the import-mapping approach),
`app/config.py`, `schema.sql`, `app/Home.py`, a page, the tests, README and
CLAUDE.md. Write this app's `CLAUDE.md` from BLUEPRINT's rules.

## Step 2: what to build

{{SPEC}}

## Step 3: order of work

1. **PR 1, the skeleton**: every template file, `app/config.py`,
   `schema.sql` with all tables, `app/data.py` with the connection and
   settings functions, `app/logic.py` with the shared helpers, `app/ui.py`,
   `app/theme.py`, a Home page that draws its empty state, `CLAUDE.md`, and
   a README whose first-time setup section is a numbered list I can follow.
   CI must be green. Tell me how to deploy once it's merged.
2. **One PR per page after that**, in the sidebar order of the spec. Each
   brings its data functions, its logic with tests, the page with a
   draws-empty and a draws-with-data test, and any README lines.
3. **Last**: a `SEED.md` note on how to enter my first records, and a round
   of checks on the live app.

Keep each PR small enough to read, and explain what it does in plain
language in its description.
