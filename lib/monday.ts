import "server-only";

import { prisma } from "@/lib/prisma";

const MONDAY_API_URL = process.env.MONDAY_API_URL || "https://api.monday.com/v2";
const MONDAY_API_VERSION = "2024-10";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set.`);
  return value;
}

async function mondayRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const token = requireEnv("MONDAY_API_TOKEN");

  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": MONDAY_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (!response.ok || json.errors) {
    throw new Error(
      `Monday.com API error: ${json.errors ? JSON.stringify(json.errors) : response.statusText}`
    );
  }

  return json.data as T;
}

interface MondayColumnValue {
  id: string;
  type: string;
  text: string | null;
  value: string | null;
}

interface MondayItem {
  id: string;
  name: string;
  board: { id: string };
  group: { id: string } | null;
  column_values: MondayColumnValue[];
}

export async function fetchMondayItem(itemId: string): Promise<MondayItem | null> {
  const query = `
    query ($itemId: [ID!]) {
      items(ids: $itemId) {
        id
        name
        board { id }
        group { id }
        column_values {
          id
          type
          text
          value
        }
      }
    }
  `;

  const data = await mondayRequest<{ items: MondayItem[] }>(query, { itemId: [itemId] });
  return data.items[0] ?? null;
}

function extractPersonId(columnValue: MondayColumnValue | undefined): string | null {
  if (!columnValue?.value) return null;
  try {
    const parsed = JSON.parse(columnValue.value) as {
      personsAndTeams?: { id: number | string; kind: string }[];
    };
    const person = parsed.personsAndTeams?.find((entry) => entry.kind === "person");
    return person ? String(person.id) : null;
  } catch {
    return null;
  }
}

function isDoneLabel(columnValue: MondayColumnValue | undefined): boolean {
  const doneLabel = process.env.MONDAY_DONE_LABEL || "Done";
  return (columnValue?.text ?? "").trim().toLowerCase() === doneLabel.trim().toLowerCase();
}

interface UpdateStatusParams {
  itemId: string;
  boardId: string;
  columnId?: string | null;
  done: boolean;
}

export async function updateMondayItemStatus({ itemId, boardId, columnId, done }: UpdateStatusParams) {
  const resolvedColumnId = columnId || requireEnv("MONDAY_STATUS_COLUMN_ID");
  const label = done
    ? process.env.MONDAY_DONE_LABEL || "Done"
    : process.env.MONDAY_TODO_LABEL || "Working on it";

  const mutation = `
    mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }
  `;

  await mondayRequest(mutation, {
    boardId,
    itemId,
    columnId: resolvedColumnId,
    value: JSON.stringify({ label }),
  });
}

// Re-fetches the authoritative item state from Monday.com and upserts the local Task row.
// We always pull full state rather than parsing the webhook payload's inline diff, since
// column value shapes differ by column type and this keeps the sync logic simple and correct.
export async function syncTaskFromMonday(itemId: string) {
  const item = await fetchMondayItem(itemId);
  if (!item) return null;

  const statusColumnId = process.env.MONDAY_STATUS_COLUMN_ID || null;
  const personColumnId = process.env.MONDAY_PERSON_COLUMN_ID || "person";

  const statusColumnValue = item.column_values.find((cv) => cv.id === statusColumnId);
  const personColumnValue = item.column_values.find((cv) => cv.id === personColumnId);

  const status = isDoneLabel(statusColumnValue) ? "DONE" : "PENDING";
  const mondayAssigneeUserId = extractPersonId(personColumnValue);

  let assigneeId: string | null = null;
  if (mondayAssigneeUserId) {
    const teamMember = await prisma.teamMember.findUnique({
      where: { mondayUserId: mondayAssigneeUserId },
    });
    assigneeId = teamMember?.id ?? null;
  }

  return prisma.task.upsert({
    where: { mondayItemId: item.id },
    create: {
      mondayItemId: item.id,
      mondayBoardId: item.board.id,
      mondayGroupId: item.group?.id,
      title: item.name,
      status,
      statusColumnId,
      mondayAssigneeUserId,
      assigneeId,
      lastMondaySyncAt: new Date(),
    },
    update: {
      title: item.name,
      status,
      mondayAssigneeUserId,
      assigneeId,
      lastMondaySyncAt: new Date(),
    },
  });
}
