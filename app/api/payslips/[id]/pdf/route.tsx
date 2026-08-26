import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { prisma } from "@/lib/prisma";
import { PayslipDocument } from "@/components/payslips/payslip-document";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const record = await prisma.payrollRecord.findUnique({
    where: { id },
    include: { employee: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Payroll record not found." }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <PayslipDocument
      data={{
        employee: {
          employeeId: record.employee.employeeId,
          name: record.employee.name,
          department: record.employee.department,
          position: record.employee.position,
        },
        payPeriodStart: record.payPeriodStart.toISOString(),
        payPeriodEnd: record.payPeriodEnd.toISOString(),
        grossPay: record.grossPay,
        sssDeduction: record.sssDeduction,
        philhealthDeduction: record.philhealthDeduction,
        pagibigDeduction: record.pagibigDeduction,
        taxDeduction: record.taxDeduction,
        totalDeductions: record.totalDeductions,
        netPay: record.netPay,
        status: record.status,
      }}
    />
  );

  const fileName = `Payslip-${record.employee.employeeId}-${record.payPeriodStart
    .toISOString()
    .slice(0, 10)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
