import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  return NextResponse.json(record);
}
