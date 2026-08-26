import { Users, ClipboardList, Wallet, Lock } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [employeeCount, attendanceCount, departmentGroups, latestPayroll, lockedAgg, recentRecords] =
    await Promise.all([
      prisma.employee.count(),
      prisma.attendanceLog.count(),
      prisma.employee.groupBy({ by: ["department"], _count: { _all: true } }),
      prisma.payrollRecord.findFirst({ orderBy: { payPeriodStart: "desc" } }),
      prisma.payrollRecord.aggregate({
        where: { status: "LOCKED" },
        _sum: { netPay: true },
        _count: { _all: true },
      }),
      prisma.payrollRecord.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: { employee: true },
      }),
    ]);

  const stats = [
    {
      label: "Total Employees",
      value: employeeCount.toString(),
      icon: Users,
    },
    {
      label: "Attendance Logs",
      value: attendanceCount.toString(),
      icon: ClipboardList,
    },
    {
      label: "Locked Payrolls",
      value: lockedAgg._count._all.toString(),
      icon: Lock,
    },
    {
      label: "Total Net Pay (Locked)",
      value: formatCurrency(lockedAgg._sum.netPay ?? 0),
      icon: Wallet,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Snapshot of your workforce, attendance, and payroll status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
            <CardDescription>Current headcount distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentGroups.length === 0 ? (
              <p className="text-muted-foreground text-sm">No employees yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {departmentGroups.map((group) => (
                  <li key={group.department} className="flex items-center justify-between text-sm">
                    <span>{group.department}</span>
                    <span className="text-muted-foreground">{group._count._all} employee(s)</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Pay Period</CardTitle>
            <CardDescription>Most recently processed payroll batch</CardDescription>
          </CardHeader>
          <CardContent>
            {latestPayroll ? (
              <p className="text-sm">
                {formatDate(latestPayroll.payPeriodStart)} &ndash; {formatDate(latestPayroll.payPeriodEnd)}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">No payroll processed yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Updated Payroll Records</CardTitle>
          <CardDescription>Last 5 payroll records touched</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing processed yet.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {recentRecords.map((record) => (
                <li key={record.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{record.employee.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {formatDate(record.payPeriodStart)} &ndash; {formatDate(record.payPeriodEnd)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(record.netPay)}</div>
                    <div className="text-muted-foreground text-xs">{record.status}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
