import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const record = await prisma.payrollRecord.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Payroll record not found." }, { status: 404 });
  }
  if (record.status === "LOCKED") {
    return NextResponse.json({ error: "Payroll record is already locked." }, { status: 409 });
  }

  const updated = await prisma.payrollRecord.update({
    where: { id },
    data: { status: "LOCKED" },
    include: { employee: true },
  });

  return NextResponse.json(updated);
}
