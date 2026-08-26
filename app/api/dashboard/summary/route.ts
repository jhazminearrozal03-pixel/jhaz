import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [employeeCount, departmentGroups, latestPayroll, lockedPayrollAgg, attendanceCount] =
    await Promise.all([
      prisma.employee.count(),
      prisma.employee.groupBy({ by: ["department"], _count: { _all: true } }),
      prisma.payrollRecord.findFirst({
        orderBy: { payPeriodStart: "desc" },
        select: { payPeriodStart: true, payPeriodEnd: true },
      }),
      prisma.payrollRecord.aggregate({
        where: { status: "LOCKED" },
        _sum: { netPay: true, grossPay: true, totalDeductions: true },
        _count: { _all: true },
      }),
      prisma.attendanceLog.count(),
    ]);

  return NextResponse.json({
    employeeCount,
    departmentGroups: departmentGroups.map((d) => ({
      department: d.department,
      count: d._count._all,
    })),
    latestPayPeriod: latestPayroll,
    lockedPayroll: {
      count: lockedPayrollAgg._count._all,
      totalNetPay: lockedPayrollAgg._sum.netPay ?? 0,
      totalGrossPay: lockedPayrollAgg._sum.grossPay ?? 0,
      totalDeductions: lockedPayrollAgg._sum.totalDeductions ?? 0,
    },
    attendanceLogCount: attendanceCount,
  });
}
