# Finance Tracker: what it does (first draft, edit freely)

A personal money tracker for one person: where the money is, where it goes,
what's due, and whether the plan is working. Plain, fast, phone-friendly.

## Pages (sidebar order)

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

## Tables (schema.sql, each `create table if not exists`)

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

## Rules of thumb for the maths (logic.py, pure)

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

## Later, not now

A monthly review email built by code (the career tracker's digest pattern), a
scheduled Claude task that categorises imported transactions, and a
year-in-review page. Build the nine pages first.
