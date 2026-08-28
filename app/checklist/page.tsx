import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentTeamMember } from "@/lib/checklist-dal";
import { ChecklistDashboard } from "@/components/checklist/checklist-dashboard";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const teamMember = await getCurrentTeamMember();
  if (!teamMember) {
    redirect("/checklist/login");
  }

  const tasks = await prisma.task.findMany({
    where: { assigneeId: teamMember.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ChecklistDashboard
      currentUser={{ name: teamMember.name, email: teamMember.email }}
      initialTasks={tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
      }))}
    />
  );
}
