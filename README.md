# Payroll Assistant

A full-stack Philippine payroll processing app built with Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Prisma, and SQLite.

## Features

- **Employees** — manage the workforce roster (salary, daily rate, department, position).
- **Attendance Upload** — upload a CSV of daily attendance (`employeeId, date, hoursWorked, overtimeHours, lateMinutes`) via PapaParse.
- **Payroll Processing** — compute gross pay, SSS / PhilHealth / Pag-IBIG / BIR withholding tax deductions, and net pay for a pay period, then **Approve & Lock** the batch.
- **Payslips** — download a clean PDF payslip per employee/pay period, generated with `@react-pdf/renderer`.

## Getting Started

```bash
npm install
npm run db:migrate   # create/update the SQLite schema
npm run db:seed       # load sample employees + attendance
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Statutory Deduction Rules

Implemented in `lib/payroll.ts` (simplified for demonstration):

- **SSS** — 15% total (10% employer / 5% employee), Monthly Salary Credit capped at PHP 35,000.
- **PhilHealth** — 5% total (2.5% / 2.5%), base floored at PHP 10,000 and capped at PHP 100,000.
- **Pag-IBIG** — 2% employee share, capped at PHP 200/month.
- **BIR Withholding Tax** — progressive TRAIN-law brackets, applied on a monthly or semi-monthly basis depending on the pay period length.

## Tech Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Shadcn UI · Prisma ORM · SQLite · PapaParse · @react-pdf/renderer · lucide-react
