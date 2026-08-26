import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ employeeId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { employeeId } = await params;
  const employee = await prisma.employee.findUnique({ where: { employeeId } });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }
  return NextResponse.json(employee);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { employeeId } = await params;
  const body = await request.json();

  try {
    const employee = await prisma.employee.update({
      where: { employeeId },
      data: {
        name: body.name,
        department: body.department,
        basicMonthlySalary: body.basicMonthlySalary,
        dailyRate: body.dailyRate,
        position: body.position,
        ...(body.portalPassword ? { portalPassword: body.portalPassword } : {}),
      },
    });
    return NextResponse.json(employee);
  } catch {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { employeeId } = await params;
  try {
    await prisma.employee.delete({ where: { employeeId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }
}
