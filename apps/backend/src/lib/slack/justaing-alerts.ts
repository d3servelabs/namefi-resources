import { secrets } from '#lib/env';
import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'justaing-slack-alerts' });

const SLACK_TEXT_LIMIT = 3000;
const SLACK_FIELD_LIMIT = 1800;
const SLACK_SECTION_FIELD_LIMIT = 10;

export interface JustaingSlackAlertInput {
  title: string;
  message: string;
  extraData?: Record<string, unknown>;
  action?: {
    text: string;
    url: string;
  };
}

export async function sendJustaingSlackAlert(
  input: JustaingSlackAlertInput,
): Promise<boolean> {
  const webhookUrl = secrets.NAMEFI_JUSTAING_ALERT_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn(
      'No Justaing Slack webhook URL configured, skipping Slack alert',
    );
    return false;
  }

  try {
    const fieldSections = chunkArray(
      Object.entries(input.extraData ?? {}).map(([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${formatSlackValue(value)}`,
      })),
      SLACK_SECTION_FIELD_LIMIT,
    ).map((sectionFields) => ({
      type: 'section',
      fields: sectionFields,
    }));

    const actionBlock = input.action
      ? [
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: input.action.text,
                },
                url: input.action.url,
                style: 'primary',
              },
            ],
          },
        ]
      : [];

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: truncateSlackText(input.title, 150),
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${truncateSlackText(input.message, SLACK_TEXT_LIMIT)}`,
            },
          },
          ...fieldSections,
          ...actionBlock,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to send Justaing Slack alert');
    return false;
  }
}

export function buildSlackErrorFields(error: unknown, fallbackMessage: string) {
  return {
    errorName: error instanceof Error ? error.name || 'Error' : typeof error,
    error:
      error instanceof Error
        ? error.message || fallbackMessage
        : formatSlackValue(error || fallbackMessage),
    errorStack:
      error instanceof Error && error.stack
        ? truncateSlackText(error.stack, SLACK_FIELD_LIMIT)
        : 'not available',
  };
}

function formatSlackValue(value: unknown) {
  if (value == null) {
    return 'not provided';
  }

  if (typeof value === 'string') {
    return truncateSlackText(value, SLACK_FIELD_LIMIT);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized) {
      return truncateSlackText(serialized, SLACK_FIELD_LIMIT);
    }
  } catch {
    return truncateSlackText(formatFallbackValue(value), SLACK_FIELD_LIMIT);
  }

  return truncateSlackText(formatFallbackValue(value), SLACK_FIELD_LIMIT);
}

function formatFallbackValue(value: unknown) {
  try {
    return String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function truncateSlackText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 24)}... [truncated]`;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
