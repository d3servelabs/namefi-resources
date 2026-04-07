import { logger } from '#lib/logger';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

/** ClickUp priority: 1=Urgent, 2=High, 3=Normal, 4=Low */
export type ClickUpPriority = 1 | 2 | 3 | 4;

export interface CreateClickUpTaskInput {
  name: string;
  description: string;
  priority: ClickUpPriority;
  tags?: string[];
  listId: string;
  token: string;
}

export interface CreateClickUpTaskResult {
  id: string;
  url: string;
}

export async function createClickUpTask(
  input: CreateClickUpTaskInput,
): Promise<CreateClickUpTaskResult> {
  const { listId, token, ...body } = input;

  const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    throw new Error(
      `ClickUp API error ${response.status}: ${response.statusText} - ${text}`,
    );
  }

  const data = (await response.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}

export interface GetClickUpTaskResult {
  id: string;
  status: string;
  assignees: string[];
  dateCreated: string;
}

export async function getClickUpTask({
  taskId,
  token,
}: {
  taskId: string;
  token: string;
}): Promise<GetClickUpTaskResult> {
  const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
    method: 'GET',
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    throw new Error(
      `ClickUp API error ${response.status}: ${response.statusText} - ${text}`,
    );
  }

  const data = (await response.json()) as {
    id: string;
    status: { status: string };
    assignees: Array<{ username: string }>;
    date_created: string;
  };

  return {
    id: data.id,
    status: data.status.status,
    assignees: data.assignees.map((a) => a.username),
    dateCreated: data.date_created,
  };
}
