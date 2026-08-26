import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePayroll } from "@/lib/payroll";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const records = await prisma.payrollRecord.findMany({
    where: {
      ...(start && end
        ? { payPeriodStart: new Date(start), payPeriodEnd: new Date(end) }
        : {}),
    },
    include: { employee: true },
    orderBy: [{ payPeriodStart: "desc" }, { employee: { name: "asc" } }],
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { payPeriodStart, payPeriodEnd, employeeIds } = body as {
    payPeriodStart?: string;
    payPeriodEnd?: string;
    employeeIds?: string[];
  };

  if (!payPeriodStart || !payPeriodEnd) {
    return NextResponse.json(
      { error: "payPeriodStart and payPeriodEnd are required." },
      { status: 400 }
    );
  }

  const start = new Date(payPeriodStart);
  const end = new Date(payPeriodEnd);
  end.setHours(23, 59, 59, 999);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return NextResponse.json({ error: "Invalid pay period range." }, { status: 400 });
  }

  const employees = await prisma.employee.findMany({
    where: employeeIds?.length ? { employeeId: { in: employeeIds } } : undefined,
    orderBy: { name: "asc" },
  });

  if (employees.length === 0) {
    return NextResponse.json({ error: "No employees found to process." }, { status: 404 });
  }

  const results = [];

  for (const employee of employees) {
    const existingLocked = await prisma.payrollRecord.findUnique({
      where: {
        employeeId_payPeriodStart_payPeriodEnd: {
          employeeId: employee.employeeId,
          payPeriodStart: start,
          payPeriodEnd: end,
        },
      },
    });
    if (existingLocked?.status === "LOCKED") {
      results.push({ ...existingLocked, employee });
      continue;
    }

    const logs = await prisma.attendanceLog.findMany({
      where: {
        employeeId: employee.employeeId,
        date: { gte: start, lte: end },
      },
    });

    const attendance = logs.reduce(
      (acc, log) => ({
        hoursWorked: acc.hoursWorked + log.hoursWorked,
        overtimeHours: acc.overtimeHours + log.overtimeHours,
        lateMinutes: acc.lateMinutes + log.lateMinutes,
      }),
      { hoursWorked: 0, overtimeHours: 0, lateMinutes: 0 }
    );

    const computed = computePayroll({
      basicMonthlySalary: employee.basicMonthlySalary,
      dailyRate: employee.dailyRate,
      attendance,
      payPeriodStart: start,
      payPeriodEnd: end,
    });

    const record = await prisma.payrollRecord.upsert({
      where: {
        employeeId_payPeriodStart_payPeriodEnd: {
          employeeId: employee.employeeId,
          payPeriodStart: start,
          payPeriodEnd: end,
        },
      },
      update: {
        grossPay: computed.grossPay,
        sssDeduction: computed.sss.employeeShare,
        philhealthDeduction: computed.philhealth.employeeShare,
        pagibigDeduction: computed.pagibig.employeeShare,
        taxDeduction: computed.taxDeduction,
        totalDeductions: computed.totalDeductions,
        netPay: computed.netPay,
        status: "DRAFT",
      },
      create: {
        employeeId: employee.employeeId,
        payPeriodStart: start,
        payPeriodEnd: end,
        grossPay: computed.grossPay,
        sssDeduction: computed.sss.employeeShare,
        philhealthDeduction: computed.philhealth.employeeShare,
        pagibigDeduction: computed.pagibig.employeeShare,
        taxDeduction: computed.taxDeduction,
        totalDeductions: computed.totalDeductions,
        netPay: computed.netPay,
        status: "DRAFT",
      },
      include: { employee: true },
    });

    results.push(record);
  }

  return NextResponse.json(results);
}
