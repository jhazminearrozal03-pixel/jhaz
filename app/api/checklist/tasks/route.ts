import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentTeamMember } from "@/lib/checklist-dal";

export async function GET() {
  const teamMember = await getCurrentTeamMember();
  if (!teamMember) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { assigneeId: teamMember.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}
