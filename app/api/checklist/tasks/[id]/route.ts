import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentTeamMember } from "@/lib/checklist-dal";
import { updateMondayItemStatus } from "@/lib/monday";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const teamMember = await getCurrentTeamMember();
  if (!teamMember) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.done !== "boolean") {
    return NextResponse.json({ error: "'done' boolean is required." }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task || task.assigneeId !== teamMember.id) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const nextStatus = body.done ? "DONE" : "PENDING";
  if (task.status === nextStatus) {
    return NextResponse.json(task);
  }

  try {
    await updateMondayItemStatus({
      itemId: task.mondayItemId,
      boardId: task.mondayBoardId,
      columnId: task.statusColumnId,
      done: body.done,
    });
  } catch (error) {
    console.error("Failed to sync task status to Monday.com", error);
    return NextResponse.json(
      { error: "Could not update Monday.com. Please try again." },
      { status: 502 }
    );
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { status: nextStatus, lastMondaySyncAt: new Date() },
  });

  return NextResponse.json(updated);
}
