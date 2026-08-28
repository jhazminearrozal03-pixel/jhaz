import { NextResponse } from "next/server";

import { deleteChecklistSession } from "@/lib/checklist-session";

export async function POST() {
  await deleteChecklistSession();
  return NextResponse.json({ success: true });
}
