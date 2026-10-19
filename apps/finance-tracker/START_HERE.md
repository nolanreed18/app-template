# Kickoff prompt for Finance Tracker

Paste everything below the line as the first message of a Claude Code cloud
session opened on the new, empty repository `nolanreed18/finance-tracker`, in the
`finance-tracker` cloud environment (see CHECKLIST.md).

---

You are building a new app for me from scratch in this empty repository:
a personal finance tracker: where the money is, where it goes, what's due, and whether the plan is working. It follows my app template, `nolanreed18/app-template`
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
rules and the file layout, and the files under `reference/` for the pattern
of the parts you write yourself: `app/ui.py` (keep the setup, sign-in,
appearance, card, empty, disclosure, sections, delete_button, round_key,
badge and md helpers; replace the app-specific badge tables), `app/data.py`
(keep the connection, migrations, cursors, readers, today(), settings;
replace the table functions), `app/logic.py` (keep blank, value,
for_display, plural, when, clock, money and the import-mapping approach),
`app/config.py`, `schema.sql`, `app/Home.py`, a page, the tests, README and
CLAUDE.md. Write this app's `CLAUDE.md` from BLUEPRINT's rules.

## Step 2: what to build

A personal money tracker for one person: where the money is, where it goes,
what's due, and whether the plan is working. Plain, fast, phone-friendly.

### Pages (sidebar order)

1. **Home**: three stat cards (net worth now; this month's spending vs budget;
   this month's savings rate), then **Needs attention**: bills due in the next
   7 days or overdue, budget categories over 90% for the month, accounts with
   no balance update for 30+ days. Buttons: Add transaction, Add balances.
2. **Accounts**: every account with type (checking, savings, credit card,
   brokerage, retirement, loan, cash, other), institution, whether it's a
   liability, latest balance and when it was updated. Add form behind a
   disclosure button; edit via a pick-one dropdown; close (not delete) an
   account that has history; delete only an empty one, with the tick-box
   delete.
3. **Transactions**: a filterable table (month, account, category, text
   search) with totals for the filter; add form behind a disclosure; edit and
   delete via a pick-one dropdown. A transaction has a date, account, amount
   (signed: income positive, spending negative), kind (income, expense,
   transfer), category, payee, notes.
4. **Budgets**: a month picker; per category, budgeted vs spent as a bar with
   the amount left; "Copy last month" button; categories are managed here
   (add, rename, archive).
5. **Bills**: recurring bills and subscriptions: name, amount, cadence
   (weekly, monthly, yearly), next due date, account, autopay flag.
   **Mark paid** moves the due date forward one cadence and, if ticked, logs
   the transaction.
6. **Net worth**: monthly balance snapshots per account (a form that lists
   every open account with its last balance prefilled: fill in today's and
   save them all at once); a line chart of net worth over time; a table of
   assets vs liabilities.
7. **Goals**: savings goals with a target amount, target date and the account
   that holds the money; progress from that account's latest balance.
8. **Stats**: spending by category for a chosen month and the last 3 months;
   income vs spending by month for 12 months; savings rate trend; top payees.
9. **Import**: a CSV exported from a bank or card. Header aliases (date;
   description/payee; one signed amount column, or debit and credit columns;
   category), a preview, and all-or-nothing import. The same row (account,
   date, amount, description) never imports twice.

The sidebar has the Dark mode switch, the signed-in email and Sign out, as in
the career tracker.

### Tables (schema.sql, each `create table if not exists`)

- `accounts`: account_id, name, kind (CHECK on `config.ACCOUNT_TYPES`),
  institution, is_liability bool, opened_on, closed_on, notes.
- `categories`: category_id, name (unique, case-insensitive), kind
  (income/expense), archived bool, sort order.
- `transactions`: transaction_id, account_id, happened_on, amount
  numeric(12,2) signed, kind (CHECK on `config.TRANSACTION_KINDS`),
  category_id, payee, notes, import_key (unique, nullable), created_on.
- `budgets`: budget_id, month (first day of the month), category_id, amount;
  unique (month, category_id).
- `bills`: bill_id, name, amount, cadence (CHECK on `config.CADENCES`),
  next_due_on, account_id, autopay bool, category_id, active bool, notes.
- `balances`: balance_id, account_id, as_of (date), amount; unique
  (account_id, as_of).
- `goals`: goal_id, name, target_amount, target_on, account_id, note,
  reached_on.
- `settings`: key, value (theme and the like).

Money is `numeric(12,2)` in Postgres and `Decimal` in Python; never float.
Dates are plain dates; "today" is `data.today()` in America/Chicago.

### Rules of thumb for the maths (logic.py, pure)

- Net worth = sum of the latest balance of each open account, liabilities
  negative.
- Month spending = sum of expense transactions in the month, as a positive
  number; income likewise; savings rate = (income − spending) / income, or
  "—" when there's no income.
- A bill is overdue when next_due_on is before today; due soon within 7 days
  (`config.BILL_LOOKAHEAD_DAYS`).
- A budget is "over" at 100% and "close" at 90% (`config.BUDGET_WARN`).
- Import dedupe key: account, date, amount, and the description lower-cased
  with punctuation dropped.

### Later, not now

A monthly review email built by code (the career tracker's digest pattern), a
scheduled Claude task that categorises imported transactions, and a
year-in-review page. Build the nine pages first.

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
