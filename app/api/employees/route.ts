import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { employeeId, name, department, basicMonthlySalary, dailyRate, position, portalPassword } = body;

  if (!employeeId || !name || !department || !position || !portalPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (typeof basicMonthlySalary !== "number" || typeof dailyRate !== "number") {
    return NextResponse.json(
      { error: "basicMonthlySalary and dailyRate must be numbers." },
      { status: 400 }
    );
  }

  try {
    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        department,
        basicMonthlySalary,
        dailyRate,
        position,
        portalPassword,
      },
    });
    return NextResponse.json(employee, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An employee with that employeeId already exists." },
      { status: 409 }
    );
  }
}
