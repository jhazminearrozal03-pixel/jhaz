import "server-only";

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/prisma";

export const CHECKLIST_COOKIE_NAME = "checklist_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set.");
  return new TextEncoder().encode(secret);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createChecklistSession(teamMemberId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.checklistSession.create({
    data: { tokenHash: hashSessionToken(token), teamMemberId, expiresAt },
  });

  const cookieValue = await new SignJWT({ token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(CHECKLIST_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getChecklistSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CHECKLIST_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  try {
    const { payload } = await jwtVerify(cookieValue, getSecretKey(), { algorithms: ["HS256"] });
    return typeof payload.token === "string" ? payload.token : null;
  } catch {
    return null;
  }
}

export async function deleteChecklistSession() {
  const token = await getChecklistSessionToken();
  if (token) {
    await prisma.checklistSession
      .deleteMany({ where: { tokenHash: hashSessionToken(token) } })
      .catch(() => {});
  }

  const cookieStore = await cookies();
  cookieStore.delete(CHECKLIST_COOKIE_NAME);
}
