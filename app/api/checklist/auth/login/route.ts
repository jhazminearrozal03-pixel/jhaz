import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createChecklistSession } from "@/lib/checklist-session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const teamMember = await prisma.teamMember.findUnique({ where: { email } });
  if (!teamMember || !verifyPassword(password, teamMember.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createChecklistSession(teamMember.id);

  return NextResponse.json({ id: teamMember.id, name: teamMember.name, email: teamMember.email });
}
