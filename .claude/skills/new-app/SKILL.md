---
name: new-app
description: Start a new app from this template. Interviews the owner about the app, writes its kickoff prompt, spec and checklist under apps/<slug>/, and opens a pull request.
---

# /new-app

The owner wants a new app built on the template. Produce three files under
`apps/<slug>/` (slug: lower-case, hyphens, e.g. `habit-tracker`) and open a
pull request. Never create the repository, environment, database or secrets:
those are the owner's steps in CHECKLIST.md.

## 1. Interview, one round

Use AskUserQuestion where choices fit; otherwise ask in plain prose. Ask
only what the arguments didn't already say:

1. **Name and one line**: what the app is for, in a sentence.
2. **Pages**: which screens, in sidebar order, or "you propose".
3. **Records**: what it keeps (the tables, in everyday words) and which
   lists are fixed choices (statuses, kinds, categories).
4. **Home**: what should count as "needs attention", and the two or three
   headline numbers.
5. **Imports**: any spreadsheet or CSV to pull in, and from where.
6. **Automation**: a scheduled Claude task or an email, now or later.
7. **Privacy**: is a public Streamlit app behind the sign-in wall fine, or
   should this one take the private slot? Anything especially sensitive?
8. **Borrow**: anything from an existing app to copy outright.

## 2. Propose the spec

Draft `SPEC.md` in the shape BLUEPRINT.md describes (pages, tables, Home,
the maths in words, imports and their dedupe rule, later-not-now). Use
`apps/finance-tracker/SPEC.md` as the model for depth. Show it, take one
round of changes, then write it.

## 3. Write the files

- `apps/<slug>/SPEC.md`: the agreed spec.
- `apps/<slug>/START_HERE.md`: `KICKOFF_TEMPLATE.md` with `{{APP_NAME}}`,
  `{{REPO}}` (the slug), `{{ONE_LINE}}` filled in and `{{SPEC}}` replaced by
  the spec's body (its headings one level deeper).
- `apps/<slug>/CHECKLIST.md`: `CHECKLIST.md` with the blanks filled in, plus
  any extra step the answers call for (the private slot, an extra secret).

## 4. Hand over

Open a pull request adding the folder. In the reply: say where the three
files are, paste the checklist's steps as the numbered list of what only the
owner can do, and remind them that START_HERE.md is pasted whole as the
first message of a session on the new repository.
