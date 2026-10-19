# App template

This repository holds the blueprint, the copy-as-is files and the kickoff
prompts for the owner's personal apps (Streamlit + Neon Postgres + GitHub +
Claude Code cloud sessions). It is not an app itself; nothing here runs.
The owner is new to GitHub and coding: explain in plain language, do the
work yourself, and end with a short numbered list of anything only they
can do.

## Jobs a session here does

- **Start a new app**: the `/new-app` skill (`.claude/skills/new-app/`).
  Interview the owner, write `apps/<slug>/START_HERE.md`, `SPEC.md` and
  `CHECKLIST.md`, open a pull request. Never create the app's repository,
  database or secrets yourself: those are the owner's steps, in CHECKLIST.
- **Keep the template current**: when told a generic file changed in an
  app (`template/` or `reference/` material), port it here in a pull
  request, keeping file names and app-neutral wording. `BLUEPRINT.md` is the
  single source of truth for the rules and `DESIGN.md` for the look;
  `KICKOFF_TEMPLATE.md` and the README must agree with them.

## Rules

- Nothing personal goes here: no data, no secrets, no connection strings,
  no email addresses beyond the owner's GitHub name. The repository is public.
- `template/` files are copied verbatim by new apps: keep them free of
  app-specific names (`tracker` as a throwaway Postgres role name is fine).
- `reference/` files are the Career Tracker's, kept as examples; don't
  "improve" them here, replace them with newer copies when asked.
- Work on a branch and open a pull request for every change.
