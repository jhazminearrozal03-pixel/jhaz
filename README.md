# Payroll Assistant

A full-stack Philippine payroll processing app built with Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Prisma, and SQLite.

## Features

- **Employees** — manage the workforce roster (salary, daily rate, department, position).
- **Attendance Upload** — upload a CSV of daily attendance (`employeeId, date, hoursWorked, overtimeHours, lateMinutes`) via PapaParse.
- **Payroll Processing** — compute gross pay, SSS / PhilHealth / Pag-IBIG / BIR withholding tax deductions, and net pay for a pay period, then **Approve & Lock** the batch.
- **Payslips** — download a clean PDF payslip per employee/pay period, generated with `@react-pdf/renderer`.
- **My Tasks** — a personal checklist for team members, kept in sync with a Monday.com board: assignments appear automatically, and checking a task off here marks it "Done" on Monday.com. See [Team Task Checklist (Monday.com sync)](#team-task-checklist-mondaycom-sync) below.

## Getting Started

```bash
npm install
npm run db:migrate   # create/update the SQLite schema
npm run db:seed       # load sample employees + attendance + team members
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign in to **My Tasks** at [http://localhost:3000/checklist/login](http://localhost:3000/checklist/login) with one of the seeded team members, e.g. `juan.delacruz@example.com` / `changeme123`.

## Statutory Deduction Rules

Implemented in `lib/payroll.ts` (simplified for demonstration):

- **SSS** — 15% total (10% employer / 5% employee), Monthly Salary Credit capped at PHP 35,000.
- **PhilHealth** — 5% total (2.5% / 2.5%), base floored at PHP 10,000 and capped at PHP 100,000.
- **Pag-IBIG** — 2% employee share, capped at PHP 200/month.
- **BIR Withholding Tax** — progressive TRAIN-law brackets, applied on a monthly or semi-monthly basis depending on the pay period length.

## Team Task Checklist (Monday.com sync)

Team members log in at `/checklist` and see only the Monday.com items assigned to them, as a checklist. Checking a box calls the Monday.com GraphQL API to set that item's status column to "Done" (and unchecking reverts it); Monday.com webhooks push new/changed/removed items into the local database as they happen on the board.

### How it works

- `prisma/schema.prisma` — `TeamMember` (login + a `mondayUserId` mapping to a Monday.com person), `Task` (mirrors one Monday.com item), `WebhookEvent` (audit log of inbound webhook deliveries), `ChecklistSession` (server-side login sessions).
- `app/api/webhooks/monday/route.ts` — receives Monday.com webhooks (item created, column/status changed, item deleted), verifies a shared secret, and re-fetches the item from the Monday.com API to upsert the local `Task` row.
- `lib/monday.ts` — the Monday.com GraphQL client: fetching an item's current state and pushing a status change back to Monday.com when a box is checked/unchecked.
- `app/checklist` + `components/checklist/checklist-dashboard.tsx` — the team member login and checklist UI.

### 1. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
| --- | --- |
| `SESSION_SECRET` | Random secret signing checklist login cookies. Generate with `openssl rand -base64 32`. |
| `MONDAY_API_TOKEN` | A Monday.com API token (your profile's **Developer > My Access Tokens**, or an app token) with read/write access to the board. |
| `MONDAY_WEBHOOK_SECRET` | A secret you choose. Appended as `?secret=...` to the webhook URL you register in Monday.com — Monday.com doesn't sign webhook payloads, so this is what authenticates incoming requests. |
| `MONDAY_BOARD_ID` | The id of the board being synced. |
| `MONDAY_STATUS_COLUMN_ID` | The column id of the status column that represents completion (open the board, click the column header > "..." > look at the API/automations panel, or query `boards(ids: [...]) { columns { id title } }` in Monday's API playground). |
| `MONDAY_DONE_LABEL` / `MONDAY_TODO_LABEL` | The exact status labels to use for done / not-done (defaults: `Done` / `Working on it`). Must match your board's status column labels exactly. |
| `MONDAY_PERSON_COLUMN_ID` | The column id of the assignee/person column (default: `person`). |

### 2. Register the webhook in Monday.com

On the board: **Integrations center > Webhooks**, and add recipes pointing at:

```
https://<your-deployed-app>/api/webhooks/monday?secret=<MONDAY_WEBHOOK_SECRET>
```

for these triggers: **"When an item is created"**, **"When status changes"**, **"When someone is assigned"**, and **"When an item is deleted"**. Monday.com will immediately POST a verification `challenge` to that URL, which the route handler echoes back automatically.

### 3. Map team members to Monday.com users

Each `TeamMember` needs a `mondayUserId` so incoming "person" column assignments resolve to the right login. Find a user's id via Monday's **Admin > Users** page (or the `users` GraphQL query) and set it on the team member record (see `prisma/seed.ts` for the pattern, or update it directly via Prisma Studio: `npm run db:studio`). Until mapped, a task still syncs in but stays unassigned locally.

### 4. Try it locally

Without real Monday.com credentials, `npm run db:seed` still creates two sample team members you can log in as at `/checklist/login`; you'll just see an empty checklist until real tasks sync in (or you add rows to `Task` manually via `npm run db:studio` for a quick UI test — set a `mondayItemId`, `mondayBoardId`, `title`, and `assigneeId`).

## Tech Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Shadcn UI · Prisma ORM · SQLite · PapaParse · @react-pdf/renderer · lucide-react · jose (session signing) · Monday.com GraphQL API
