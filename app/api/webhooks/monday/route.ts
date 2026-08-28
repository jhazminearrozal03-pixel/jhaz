import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncTaskFromMonday } from "@/lib/monday";

function isAuthorized(request: NextRequest) {
  const secret = process.env.MONDAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return request.nextUrl.searchParams.get("secret") === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Monday.com verifies a newly registered webhook URL by POSTing a one-off challenge
  // that must be echoed back verbatim.
  if (typeof body.challenge === "string") {
    return NextResponse.json({ challenge: body.challenge });
  }

  const event = body.event;
  if (!event) {
    return NextResponse.json({ success: true });
  }

  const configuredBoardId = process.env.MONDAY_BOARD_ID;
  if (configuredBoardId && event.boardId && String(event.boardId) !== configuredBoardId) {
    return NextResponse.json({ success: true });
  }

  const eventType = String(event.type || "").toLowerCase();
  const itemId = event.pulseId ? String(event.pulseId) : null;

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      eventType: eventType || "unknown",
      mondayItemId: itemId,
      payload: JSON.stringify(body),
    },
  });

  try {
    if (eventType.includes("delete")) {
      if (itemId) {
        await prisma.task.deleteMany({ where: { mondayItemId: itemId } });
      }
    } else if (itemId) {
      // Covers item creation, status/column changes, and assignee changes alike: we just
      // re-fetch the item's current state rather than trying to parse every event shape.
      await syncTaskFromMonday(itemId);
    }

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "PROCESSED" },
    });
  } catch (error) {
    console.error("Failed to process Monday.com webhook event", error);
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  // Always ack with 200 so Monday.com doesn't retry or disable the webhook; failures are
  // recorded on the WebhookEvent row for troubleshooting instead.
  return NextResponse.json({ success: true });
}
