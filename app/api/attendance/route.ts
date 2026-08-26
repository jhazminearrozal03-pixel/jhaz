import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const logs = await prisma.attendanceLog.findMany({
    where: {
      ...(employeeId ? { employeeId } : {}),
      ...(start && end
        ? { date: { gte: new Date(start), lte: new Date(end) } }
        : {}),
    },
    include: { employee: { select: { name: true, department: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

interface AttendanceRow {
  employeeId?: string;
  date?: string;
  hoursWorked?: string | number;
  overtimeHours?: string | number;
  lateMinutes?: string | number;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const rows: AttendanceRow[] = Array.isArray(body?.rows) ? body.rows : [];

  if (rows.length === 0) {
    return NextResponse.json({ error: "No attendance rows provided." }, { status: 400 });
  }

  const employees = await prisma.employee.findMany({ select: { employeeId: true } });
  const knownEmployeeIds = new Set(employees.map((e) => e.employeeId));

  let inserted = 0;
  let updated = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const employeeId = String(row.employeeId ?? "").trim();
    const dateStr = String(row.date ?? "").trim();
    const hoursWorked = Number(row.hoursWorked ?? 0);
    const overtimeHours = Number(row.overtimeHours ?? 0);
    const lateMinutes = Number(row.lateMinutes ?? 0);

    if (!employeeId || !dateStr) {
      errors.push({ row: i + 1, message: "Missing employeeId or date." });
      continue;
    }
    if (!knownEmployeeIds.has(employeeId)) {
      errors.push({ row: i + 1, message: `Unknown employeeId "${employeeId}".` });
      continue;
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      errors.push({ row: i + 1, message: `Invalid date "${dateStr}".` });
      continue;
    }
    if ([hoursWorked, overtimeHours, lateMinutes].some((n) => Number.isNaN(n))) {
      errors.push({ row: i + 1, message: "hoursWorked/overtimeHours/lateMinutes must be numbers." });
      continue;
    }

    const existing = await prisma.attendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });

    await prisma.attendanceLog.upsert({
      where: { employeeId_date: { employeeId, date } },
      update: { hoursWorked, overtimeHours, lateMinutes },
      create: { employeeId, date, hoursWorked, overtimeHours, lateMinutes },
    });

    if (existing) updated++;
    else inserted++;
  }

  return NextResponse.json({ inserted, updated, errors, total: rows.length });
}
