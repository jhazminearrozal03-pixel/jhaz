import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { payPeriodStart, payPeriodEnd } = body as {
    payPeriodStart?: string;
    payPeriodEnd?: string;
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

  const result = await prisma.payrollRecord.updateMany({
    where: {
      payPeriodStart: start,
      payPeriodEnd: end,
      status: { not: "LOCKED" },
    },
    data: { status: "LOCKED" },
  });

  const records = await prisma.payrollRecord.findMany({
    where: { payPeriodStart: start, payPeriodEnd: end },
    include: { employee: true },
    orderBy: { employee: { name: "asc" } },
  });

  return NextResponse.json({ lockedCount: result.count, records });
}
