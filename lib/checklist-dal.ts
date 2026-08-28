import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getChecklistSessionToken, hashSessionToken } from "@/lib/checklist-session";

// Secure (DB-backed) session check — use this in Route Handlers and Server Components
// wherever data is actually being read or mutated. Cached per request via React's cache().
export const getCurrentTeamMember = cache(async () => {
  const token = await getChecklistSessionToken();
  if (!token) return null;

  const session = await prisma.checklistSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { teamMember: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session.teamMember;
});
