import { createHash } from 'node:crypto';
import {
  normalizeNamefiFeedSalesDigestPoint,
  normalizeNamefiFeedSalesDigestTake,
  type NamefiFeedSalesDigestFormattedPick,
} from '@namefi-astra/ai';
import {
  db,
  salesDigestTargetDeliveriesTable,
  salesDigestTargetsTable,
} from '@namefi-astra/db';
import {
  adminNamefiFeedDiscordDigestTargetConfigSchema,
  adminNamefiFeedSlackDigestTargetConfigSchema,
  adminNamefiFeedTelegramDigestTargetConfigSchema,
} from '@namefi-astra/common/contract/admin/admin-namefi-feed-contract';
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import type { Json } from 'drizzle-zod';
import { z } from 'zod';
import { secrets } from '#lib/env';
import type {
  NamefiFeedSalesDigestBounds,
  NamefiFeedSalesDigestRenderResult,
} from './digest.service';
import {
  buildSalesDigestMediaFilename,
  buildSalesDigestMediaPlan,
  loadSalesDigestHeroMediaAttachment,
  loadSalesDigestImageAttachment,
  type SalesDigestHeroMediaAttachment,
  type SalesDigestLoadedImage,
  type SalesDigestMediaAttachment,
} from './digest-media.service';

const TELEGRAM_TEXT_CHUNK_LIMIT = 3900;
const DISCORD_TEXT_CHUNK_LIMIT = 1900;
const DISCORD_SUPPRESS_EMBEDS_FLAG = 4;
const SALES_DIGEST_PENDING_DELIVERY_STALE_MS = 2 * 60 * 60 * 1000;
const SALES_DIGEST_OUTBOUND_REQUEST_TIMEOUT_MS = 15_000;

const slackUploadUrlResponseSchema = z
  .object({
    file_id: z.string(),
    upload_url: z.string(),
  })
  .passthrough();
const slackPostMessageResponseSchema = z
  .object({
    channel: z.string(),
    ts: z.string(),
  })
  .passthrough();

export type SalesDigestTargetType =
  | 'slack'
  | 'telegram_group'
  | 'discord_channel';

interface SalesDigestTargetSummaryBase {
  id: string;
  targetKey: string;
  label: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SalesDigestTargetSummary =
  | (SalesDigestTargetSummaryBase & {
      targetType: 'slack';
      config: SalesDigestSlackTargetConfig;
    })
  | (SalesDigestTargetSummaryBase & {
      targetType: 'telegram_group';
      config: SalesDigestTelegramTargetConfig;
    })
  | (SalesDigestTargetSummaryBase & {
      targetType: 'discord_channel';
      config: SalesDigestDiscordTargetConfig;
    });

export interface CreateSalesDigestTargetInput {
  targetType: SalesDigestTargetType;
  label?: string | null;
  enabled?: boolean;
  config: unknown;
  createdByUserId?: string | null;
}

export interface UpdateSalesDigestTargetInput {
  targetType: SalesDigestTargetType;
  label?: string | null;
  enabled?: boolean;
  config?: unknown;
}

export interface SalesDigestTargetDeliveryResult {
  targetId: string | null;
  targetKey: string;
  targetLabel: string;
  targetType: SalesDigestTargetType;
  status: 'sent' | 'skipped' | 'failed';
  externalMessageId: string | null;
  reason: string | null;
}

export interface SalesDigestTargetDeliverySummary {
  deliveries: SalesDigestTargetDeliveryResult[];
  failed: number;
  sent: number;
  skipped: number;
  targetCount: number;
}

export interface SalesDigestTargetDeliveryAdminSummary {
  id: string;
  digestRunId: string | null;
  targetId: string | null;
  targetKey: string;
  targetLabel: string | null;
  targetType: SalesDigestTargetType | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped' | 'partial';
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  externalMessageId: string | null;
  externalMessageUrl: string | null;
  error: string | null;
  createdAt: string;
}

type SalesDigestTargetRow = typeof salesDigestTargetsTable.$inferSelect;
type SalesDigestSlackTargetConfig = z.infer<
  typeof adminNamefiFeedSlackDigestTargetConfigSchema
>;
type SalesDigestTelegramTargetConfig = z.infer<
  typeof adminNamefiFeedTelegramDigestTargetConfigSchema
>;
type SalesDigestDiscordTargetConfig = z.infer<
  typeof adminNamefiFeedDiscordDigestTargetConfigSchema
>;
type ParsedSalesDigestTargetConfig =
  | SalesDigestSlackTargetConfig
  | SalesDigestTelegramTargetConfig
  | SalesDigestDiscordTargetConfig;

interface SalesDigestDeliveryTarget {
  id: string;
  targetKey: string;
  targetType: SalesDigestTargetType;
  label: string;
  enabled: boolean;
  config: ParsedSalesDigestTargetConfig;
  createdAt: Date;
  updatedAt: Date;
}

export class SalesDigestTargetInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalesDigestTargetInputError';
  }
}

class SalesDigestTargetPartialDeliveryError extends Error {
  readonly externalMessageId: string | null;
  readonly response: Record<string, Json>;

  constructor({
    externalMessageId,
    message,
    response,
  }: {
    externalMessageId: string | null;
    message: string;
    response: Record<string, Json>;
  }) {
    super(message);
    this.name = 'SalesDigestTargetPartialDeliveryError';
    this.externalMessageId = externalMessageId;
    this.response = response;
  }
}

export async function listNamefiFeedSalesDigestTargets(): Promise<
  SalesDigestTargetSummary[]
> {
  const rows = await db
    .select()
    .from(salesDigestTargetsTable)
    .orderBy(
      asc(salesDigestTargetsTable.createdAt),
      asc(salesDigestTargetsTable.label),
    );

  return rows.map(serializeSalesDigestTarget);
}

export async function listRecentNamefiFeedSalesDigestDeliveries(
  limit = 15,
): Promise<SalesDigestTargetDeliveryAdminSummary[]> {
  const rows = await db
    .select({
      id: salesDigestTargetDeliveriesTable.id,
      digestRunId: salesDigestTargetDeliveriesTable.digestRunId,
      targetId: salesDigestTargetDeliveriesTable.targetId,
      targetKey: salesDigestTargetDeliveriesTable.targetKey,
      status: salesDigestTargetDeliveriesTable.status,
      windowStart: salesDigestTargetDeliveriesTable.windowStart,
      windowEnd: salesDigestTargetDeliveriesTable.windowEnd,
      generatedAt: salesDigestTargetDeliveriesTable.generatedAt,
      externalMessageId: salesDigestTargetDeliveriesTable.externalMessageId,
      externalMessageUrl: salesDigestTargetDeliveriesTable.externalMessageUrl,
      error: salesDigestTargetDeliveriesTable.error,
      createdAt: salesDigestTargetDeliveriesTable.createdAt,
      targetLabel: salesDigestTargetsTable.label,
      targetType: salesDigestTargetsTable.targetType,
    })
    .from(salesDigestTargetDeliveriesTable)
    .leftJoin(
      salesDigestTargetsTable,
      eq(salesDigestTargetsTable.id, salesDigestTargetDeliveriesTable.targetId),
    )
    .orderBy(desc(salesDigestTargetDeliveriesTable.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    digestRunId: row.digestRunId,
    targetId: row.targetId,
    targetKey: row.targetKey,
    targetLabel: row.targetLabel,
    targetType: row.targetType,
    status: row.status,
    windowStart: row.windowStart.toISOString(),
    windowEnd: row.windowEnd.toISOString(),
    generatedAt: row.generatedAt.toISOString(),
    externalMessageId: row.externalMessageId,
    externalMessageUrl: row.externalMessageUrl,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countNamefiFeedSalesDigestDeliveryTargets({
  enabledOnly,
  targetIds,
}: {
  enabledOnly: boolean;
  targetIds?: string[];
}): Promise<number> {
  const targets = await listTargetsForDelivery({ enabledOnly, targetIds });
  return targets.length;
}

export async function createNamefiFeedSalesDigestTarget(
  input: CreateSalesDigestTargetInput,
): Promise<SalesDigestTargetSummary> {
  const config = normalizeAndValidateTargetConfig(
    input.targetType,
    input.config,
  );
  await assertNoDuplicatePersistedTargetConfig({
    config,
    targetType: input.targetType,
  });
  const label = normalizeOptionalText(input.label) ?? defaultTargetLabel(input);
  const rows = await insertOrUpdateTargetWithDuplicateGuard(async () =>
    db
      .insert(salesDigestTargetsTable)
      .values({
        config,
        createdByUserId: input.createdByUserId ?? null,
        enabled: input.enabled ?? true,
        label,
        targetType: input.targetType,
      })
      .returning(),
  );

  if (!rows[0]) {
    throw new Error('Failed to create sales digest target.');
  }

  return serializeSalesDigestTarget(rows[0]);
}

export async function updateNamefiFeedSalesDigestTarget(
  id: string,
  input: UpdateSalesDigestTargetInput,
): Promise<SalesDigestTargetSummary | null> {
  const existing = await getSalesDigestTargetById(id);
  if (!existing) {
    return null;
  }
  if (existing.targetType !== input.targetType) {
    throw new SalesDigestTargetInputError(
      'Digest target type cannot be changed.',
    );
  }

  const nextConfig =
    input.config === undefined
      ? parseSalesDigestTargetConfig(existing.targetType, existing.config)
      : normalizeAndValidateTargetConfig(existing.targetType, input.config);
  if (
    input.config !== undefined &&
    !areSalesDigestTargetConfigsEqual(
      parseSalesDigestTargetConfig(existing.targetType, existing.config),
      nextConfig,
    ) &&
    (await hasSalesDigestTargetDeliveries(existing.id))
  ) {
    throw new SalesDigestTargetInputError(
      'Digest target destination cannot be changed after deliveries exist. Create a new target for the new destination.',
    );
  }
  await assertNoDuplicatePersistedTargetConfig({
    config: nextConfig,
    excludeId: existing.id,
    targetType: existing.targetType,
  });
  const nextLabel =
    input.label === undefined
      ? existing.label
      : (normalizeOptionalText(input.label) ?? existing.label);

  const rows = await insertOrUpdateTargetWithDuplicateGuard(async () =>
    db
      .update(salesDigestTargetsTable)
      .set({
        config: nextConfig,
        enabled:
          typeof input.enabled === 'boolean' ? input.enabled : existing.enabled,
        label: nextLabel,
        updatedAt: new Date(),
      })
      .where(eq(salesDigestTargetsTable.id, id))
      .returning(),
  );

  return rows[0] ? serializeSalesDigestTarget(rows[0]) : null;
}

export async function deleteNamefiFeedSalesDigestTarget(
  id: string,
): Promise<boolean> {
  const deleted = await db
    .delete(salesDigestTargetsTable)
    .where(eq(salesDigestTargetsTable.id, id))
    .returning({ id: salesDigestTargetsTable.id });

  return Boolean(deleted[0]);
}

export async function publishNamefiFeedSalesDigestToTargets(params: {
  at?: Date;
  bounds: NamefiFeedSalesDigestBounds;
  createdByUserId?: string | null;
  digestRender: NamefiFeedSalesDigestRenderResult;
  digestRunId?: string | null;
  enabledOnly?: boolean;
  entriesCount?: number;
  targetIds?: string[];
}): Promise<SalesDigestTargetDeliverySummary> {
  const targets = await listTargetsForDelivery({
    enabledOnly: params.enabledOnly ?? true,
    targetIds: params.targetIds,
  });
  const deliveries: SalesDigestTargetDeliveryResult[] = [];
  const at = params.at ?? new Date();
  const digestTextHash = hashDigestPayload(
    buildSalesDigestPayloadHashInput(params.digestRender),
  );

  for (const target of targets) {
    try {
      deliveries.push(
        await deliverSalesDigestToTarget({
          at,
          bounds: params.bounds,
          createdByUserId: params.createdByUserId ?? null,
          digestRender: params.digestRender,
          digestTextHash,
          digestRunId: params.digestRunId ?? null,
          target,
        }),
      );
    } catch (error) {
      deliveries.push({
        targetId: target.id,
        targetKey: target.targetKey,
        targetLabel: target.label,
        targetType: target.targetType,
        status: 'failed',
        externalMessageId: null,
        reason: error instanceof Error ? error.message : 'Delivery failed.',
      });
    }
  }

  return summarizeDeliveries(deliveries);
}

export function buildSalesDigestTargetText(
  digestRender: Pick<NamefiFeedSalesDigestRenderResult, 'text' | 'topPicks'>,
): string {
  const digestText = digestRender.text.trim();
  const topPickDetails = buildPlainTopPickDetails(digestRender.topPicks);
  return [digestText, topPickDetails].filter(Boolean).join('\n\n');
}

export function parseSalesDigestTargetConfig(
  targetType: 'slack',
  config: unknown,
): SalesDigestSlackTargetConfig;
export function parseSalesDigestTargetConfig(
  targetType: 'telegram_group',
  config: unknown,
): SalesDigestTelegramTargetConfig;
export function parseSalesDigestTargetConfig(
  targetType: 'discord_channel',
  config: unknown,
): SalesDigestDiscordTargetConfig;
export function parseSalesDigestTargetConfig(
  targetType: SalesDigestTargetType,
  config: unknown,
): ParsedSalesDigestTargetConfig;
export function parseSalesDigestTargetConfig(
  targetType: SalesDigestTargetType,
  config: unknown,
): ParsedSalesDigestTargetConfig {
  const result = (() => {
    switch (targetType) {
      case 'slack':
        return adminNamefiFeedSlackDigestTargetConfigSchema.safeParse(config);
      case 'telegram_group':
        return adminNamefiFeedTelegramDigestTargetConfigSchema.safeParse(
          config,
        );
      case 'discord_channel':
        return adminNamefiFeedDiscordDigestTargetConfigSchema.safeParse(config);
      default:
        return null;
    }
  })();

  if (!result?.success) {
    throw new SalesDigestTargetInputError(
      'Invalid sales digest target config.',
    );
  }

  return result.data;
}

export function splitDigestTargetText(
  text: string,
  maxLength: number,
): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let remaining = normalized;
  while (remaining.length > maxLength) {
    const breakpoint = findChunkBreakpoint(remaining, maxLength);
    chunks.push(remaining.slice(0, breakpoint).trim());
    remaining = remaining.slice(breakpoint).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function serializeSalesDigestTarget(
  row: SalesDigestTargetRow,
): SalesDigestTargetSummary {
  const base = {
    id: row.id,
    targetKey: persistedTargetKey(row.id),
    label: row.label,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  switch (row.targetType) {
    case 'slack':
      return {
        ...base,
        targetType: 'slack',
        config: parseSalesDigestTargetConfig('slack', row.config),
      };
    case 'telegram_group':
      return {
        ...base,
        targetType: 'telegram_group',
        config: parseSalesDigestTargetConfig('telegram_group', row.config),
      };
    case 'discord_channel':
      return {
        ...base,
        targetType: 'discord_channel',
        config: parseSalesDigestTargetConfig('discord_channel', row.config),
      };
  }
}

async function getSalesDigestTargetById(
  id: string,
): Promise<SalesDigestTargetRow | null> {
  const rows = await db
    .select()
    .from(salesDigestTargetsTable)
    .where(eq(salesDigestTargetsTable.id, id))
    .limit(1);

  return rows[0] ?? null;
}

async function hasSalesDigestTargetDeliveries(id: string): Promise<boolean> {
  const rows = await db
    .select({ id: salesDigestTargetDeliveriesTable.id })
    .from(salesDigestTargetDeliveriesTable)
    .where(eq(salesDigestTargetDeliveriesTable.targetId, id))
    .limit(1);

  return Boolean(rows[0]);
}

function areSalesDigestTargetConfigsEqual(
  left: ParsedSalesDigestTargetConfig,
  right: ParsedSalesDigestTargetConfig,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function assertNoDuplicatePersistedTargetConfig({
  config,
  excludeId,
  targetType,
}: {
  config: ParsedSalesDigestTargetConfig;
  excludeId?: string;
  targetType: SalesDigestTargetType;
}): Promise<void> {
  const configMatches = buildDuplicateTargetConfigWhere(targetType, config);
  const rows = await db
    .select({ id: salesDigestTargetsTable.id })
    .from(salesDigestTargetsTable)
    .where(
      excludeId
        ? and(
            eq(salesDigestTargetsTable.targetType, targetType),
            configMatches,
            ne(salesDigestTargetsTable.id, excludeId),
          )
        : and(
            eq(salesDigestTargetsTable.targetType, targetType),
            configMatches,
          ),
    )
    .limit(1);

  if (rows[0]) {
    throw new SalesDigestTargetInputError(
      'A sales digest target for this destination already exists.',
    );
  }
}

async function insertOrUpdateTargetWithDuplicateGuard<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      throw new SalesDigestTargetInputError(
        'A sales digest target for this destination already exists.',
      );
    }
    throw error;
  }
}

function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

function buildDuplicateTargetConfigWhere(
  targetType: SalesDigestTargetType,
  config: ParsedSalesDigestTargetConfig,
) {
  switch (targetType) {
    case 'slack': {
      const slackConfig = config as SalesDigestSlackTargetConfig;
      return sql`${salesDigestTargetsTable.config}->>'channelId' = ${slackConfig.channelId}`;
    }
    case 'telegram_group': {
      const telegramConfig = config as SalesDigestTelegramTargetConfig;
      const messageThreadId =
        telegramConfig.messageThreadId === undefined ||
        telegramConfig.messageThreadId === null
          ? null
          : String(telegramConfig.messageThreadId);
      return and(
        sql`${salesDigestTargetsTable.config}->>'chatId' = ${telegramConfig.chatId}`,
        sql`${salesDigestTargetsTable.config}->>'messageThreadId' IS NOT DISTINCT FROM ${messageThreadId}`,
      );
    }
    case 'discord_channel': {
      const discordConfig = config as SalesDigestDiscordTargetConfig;
      return sql`${salesDigestTargetsTable.config}->>'channelId' = ${discordConfig.channelId}`;
    }
  }
}

function normalizeAndValidateTargetConfig(
  targetType: SalesDigestTargetType,
  rawConfig: unknown,
): ParsedSalesDigestTargetConfig {
  const config = parseSalesDigestTargetConfig(targetType, rawConfig);

  switch (targetType) {
    case 'telegram_group':
      return {
        ...config,
        messageThreadId:
          (config as SalesDigestTelegramTargetConfig).messageThreadId ?? null,
      };
    case 'discord_channel':
      return {
        ...config,
        guildId: (config as SalesDigestDiscordTargetConfig).guildId ?? null,
      };
    default:
      return config;
  }
}

async function listTargetsForDelivery({
  enabledOnly,
  targetIds,
}: {
  enabledOnly: boolean;
  targetIds?: string[];
}): Promise<SalesDigestDeliveryTarget[]> {
  const rows = await db
    .select()
    .from(salesDigestTargetsTable)
    .orderBy(asc(salesDigestTargetsTable.createdAt));
  const targetIdSet =
    targetIds && targetIds.length > 0 ? new Set(targetIds) : null;

  return rows.map(rowToDeliveryTarget).filter((target) => {
    if (targetIdSet && !targetIdSet.has(target.id)) {
      return false;
    }
    return !enabledOnly || target.enabled;
  });
}

function rowToDeliveryTarget(
  row: SalesDigestTargetRow,
): SalesDigestDeliveryTarget {
  return {
    id: row.id,
    targetKey: persistedTargetKey(row.id),
    targetType: row.targetType,
    label: row.label,
    enabled: row.enabled,
    config: parseSalesDigestTargetConfig(row.targetType, row.config),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function deliverSalesDigestToTarget({
  at,
  bounds,
  createdByUserId,
  digestRender,
  digestTextHash,
  digestRunId,
  target,
}: {
  at: Date;
  bounds: NamefiFeedSalesDigestBounds;
  createdByUserId: string | null;
  digestRender: NamefiFeedSalesDigestRenderResult;
  digestTextHash: string;
  digestRunId: string | null;
  target: SalesDigestDeliveryTarget;
}): Promise<SalesDigestTargetDeliveryResult> {
  const existing = await findTargetDelivery({
    digestTextHash,
    targetKey: target.targetKey,
    windowStart: bounds.start,
  });

  if (existing?.status === 'sent') {
    return {
      targetId: target.id,
      targetKey: target.targetKey,
      targetLabel: target.label,
      targetType: target.targetType,
      status: 'skipped',
      externalMessageId: existing.externalMessageId,
      reason: 'already_sent',
    };
  }

  if (
    existing?.status === 'pending' &&
    !isPendingSalesDigestDeliveryStale(existing)
  ) {
    return {
      targetId: target.id,
      targetKey: target.targetKey,
      targetLabel: target.label,
      targetType: target.targetType,
      status: 'skipped',
      externalMessageId: existing.externalMessageId,
      reason: 'already_pending',
    };
  }

  if (existing?.status === 'partial') {
    return {
      targetId: target.id,
      targetKey: target.targetKey,
      targetLabel: target.label,
      targetType: target.targetType,
      status: 'skipped',
      externalMessageId: existing.externalMessageId,
      reason: 'partial_delivery_requires_manual_resolution',
    };
  }

  const reclaimExistingWhere = existing
    ? and(
        eq(salesDigestTargetDeliveriesTable.id, existing.id),
        existing.status === 'pending'
          ? and(
              eq(salesDigestTargetDeliveriesTable.status, 'pending'),
              eq(
                salesDigestTargetDeliveriesTable.updatedAt,
                existing.updatedAt,
              ),
            )
          : eq(salesDigestTargetDeliveriesTable.status, 'failed'),
      )
    : null;
  const delivery = existing
    ? (
        await db
          .update(salesDigestTargetDeliveriesTable)
          .set({
            error: null,
            externalMessageId: null,
            externalMessageUrl: null,
            generatedAt: at,
            digestRunId,
            response: null,
            status: 'pending',
            updatedAt: new Date(),
            windowEnd: bounds.end,
          })
          .where(reclaimExistingWhere ?? sql`false`)
          .returning()
      )[0]
    : (
        await db
          .insert(salesDigestTargetDeliveriesTable)
          .values({
            createdByUserId,
            digestRunId,
            digestTextHash,
            generatedAt: at,
            status: 'pending',
            targetId: target.id,
            targetKey: target.targetKey,
            windowEnd: bounds.end,
            windowStart: bounds.start,
          })
          .onConflictDoNothing({
            target: [
              salesDigestTargetDeliveriesTable.targetKey,
              salesDigestTargetDeliveriesTable.windowStart,
              salesDigestTargetDeliveriesTable.digestTextHash,
            ],
          })
          .returning()
      )[0];

  if (!delivery) {
    return {
      targetId: target.id,
      targetKey: target.targetKey,
      targetLabel: target.label,
      targetType: target.targetType,
      status: 'skipped',
      externalMessageId: null,
      reason: 'delivery_conflict',
    };
  }

  let result: Awaited<ReturnType<typeof sendDigestToTarget>>;
  try {
    result = await sendDigestToTarget({
      at,
      digestRender,
      target,
    });
  } catch (error) {
    const message = formatErrorMessage(error, 'Sales digest target failed.');
    if (error instanceof SalesDigestTargetPartialDeliveryError) {
      await db
        .update(salesDigestTargetDeliveriesTable)
        .set({
          error: message,
          externalMessageId: error.externalMessageId,
          externalMessageUrl: null,
          response: error.response,
          status: 'partial',
          updatedAt: new Date(),
        })
        .where(eq(salesDigestTargetDeliveriesTable.id, delivery.id));
      return {
        targetId: target.id,
        targetKey: target.targetKey,
        targetLabel: target.label,
        targetType: target.targetType,
        status: 'failed',
        externalMessageId: error.externalMessageId,
        reason: message,
      };
    }

    await db
      .update(salesDigestTargetDeliveriesTable)
      .set({
        error: message,
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(salesDigestTargetDeliveriesTable.id, delivery.id));
    throw error;
  }

  await db
    .update(salesDigestTargetDeliveriesTable)
    .set({
      error: null,
      externalMessageId: result.externalMessageId,
      externalMessageUrl: result.externalMessageUrl,
      response: result.response,
      status: 'sent',
      updatedAt: new Date(),
    })
    .where(eq(salesDigestTargetDeliveriesTable.id, delivery.id));

  return {
    targetId: target.id,
    targetKey: target.targetKey,
    targetLabel: target.label,
    targetType: target.targetType,
    status: 'sent',
    externalMessageId: result.externalMessageId,
    reason: null,
  };
}

async function findTargetDelivery({
  digestTextHash,
  targetKey,
  windowStart,
}: {
  digestTextHash: string;
  targetKey: string;
  windowStart: Date;
}) {
  const rows = await db
    .select()
    .from(salesDigestTargetDeliveriesTable)
    .where(
      and(
        eq(salesDigestTargetDeliveriesTable.targetKey, targetKey),
        eq(salesDigestTargetDeliveriesTable.windowStart, windowStart),
        eq(salesDigestTargetDeliveriesTable.digestTextHash, digestTextHash),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

function isPendingSalesDigestDeliveryStale(
  delivery: typeof salesDigestTargetDeliveriesTable.$inferSelect,
): boolean {
  const lastTouched = delivery.updatedAt ?? delivery.createdAt;
  return (
    Date.now() - lastTouched.getTime() >= SALES_DIGEST_PENDING_DELIVERY_STALE_MS
  );
}

async function sendDigestToTarget(params: {
  at: Date;
  digestRender: NamefiFeedSalesDigestRenderResult;
  target: SalesDigestDeliveryTarget;
}): Promise<{
  externalMessageId: string | null;
  externalMessageUrl: string | null;
  response: Record<string, Json> | null;
}> {
  switch (params.target.targetType) {
    case 'slack':
      return sendSlackDigest(params.target, params.digestRender, params.at);
    case 'telegram_group':
      return sendTelegramDigest(params.target, params.digestRender, params.at);
    case 'discord_channel':
      return sendDiscordDigest(params.target, params.digestRender, params.at);
  }
}

async function sendSlackDigest(
  target: SalesDigestDeliveryTarget,
  digestRender: NamefiFeedSalesDigestRenderResult,
  at: Date,
): Promise<{
  externalMessageId: string | null;
  externalMessageUrl: null;
  response: Record<string, Json>;
}> {
  const token = secrets.SLACK_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error('SLACK_BOT_TOKEN is required for Slack digest targets.');
  }

  const config = parseSalesDigestTargetConfig(
    'slack',
    target.config,
  ) as SalesDigestSlackTargetConfig;
  const mediaPlan = buildSalesDigestMediaPlan(digestRender);
  const comment = buildSlackDigestComment(digestRender);
  const sentFileIds: string[] = [];
  const sentLogoDomains: string[] = [];
  let heroMediaKind: SalesDigestHeroMediaAttachment['kind'] | null = null;
  let latestFileId: string | null = null;

  try {
    const hero = mediaPlan.heroMedia
      ? await uploadSlackHeroMediaWithFallback({
          at,
          channelId: config.channelId,
          comment,
          mediaPlan,
          token,
        })
      : null;

    if (!hero) {
      const messageId = await sendSlackTextMessage({
        channelId: config.channelId,
        text: comment,
        token,
      });

      return {
        externalMessageId: messageId,
        externalMessageUrl: null,
        response: {
          channel: 'slack',
          channelId: config.channelId,
          mediaKind: null,
          sentMessageIds: [messageId],
          sentLogoDomains,
          textOnly: true,
          mediaUnavailableReason: 'hero_media_not_generated',
        },
      };
    }

    latestFileId = hero.fileId;
    heroMediaKind = hero.mediaKind;
    sentFileIds.push(hero.fileId);

    for (const logo of mediaPlan.topPickLogos) {
      const image = await loadSalesDigestImageAttachment(logo);
      if (!image) {
        continue;
      }

      latestFileId = await uploadSlackFileWithComment({
        at,
        attachment: logo,
        channelId: config.channelId,
        comment: logo.caption,
        media: image,
        token,
      });
      sentFileIds.push(latestFileId);
      sentLogoDomains.push(logo.domain);
    }
  } catch (error) {
    if (sentFileIds.length > 0) {
      const reason = formatErrorMessage(
        error,
        'Slack digest delivery failed after partial delivery.',
      );
      throw new SalesDigestTargetPartialDeliveryError({
        externalMessageId: latestFileId,
        message: `Slack digest target partially delivered; manual resolution required. ${reason}`,
        response: buildMultipartDeliveryResponse({
          responseBase: {
            channel: 'slack',
            channelId: config.channelId,
            mediaKind: heroMediaKind,
          },
          sentIds: sentFileIds,
          sentIdsResponseKey: 'sentFileIds',
          sentLogoDomains,
          partial: true,
          failureReason: reason,
        }),
      });
    }
    throw error;
  }

  return {
    externalMessageId: latestFileId,
    externalMessageUrl: null,
    response: buildMultipartDeliveryResponse({
      responseBase: {
        channel: 'slack',
        channelId: config.channelId,
        mediaKind: heroMediaKind,
      },
      sentIds: sentFileIds,
      sentIdsResponseKey: 'sentFileIds',
      sentLogoDomains,
    }),
  };
}

async function sendTelegramDigest(
  target: SalesDigestDeliveryTarget,
  digestRender: NamefiFeedSalesDigestRenderResult,
  at: Date,
): Promise<{
  externalMessageId: string;
  externalMessageUrl: null;
  response: Record<string, Json>;
}> {
  const token = secrets.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'TELEGRAM_BOT_TOKEN is required for Telegram digest targets.',
    );
  }

  const config = parseSalesDigestTargetConfig(
    'telegram_group',
    target.config,
  ) as SalesDigestTelegramTargetConfig;
  const delivery = await sendMultipartSalesDigest({
    at,
    channelLabel: 'Telegram',
    digestRender,
    emptyDeliveryMessage: 'Telegram digest target produced no messages.',
    responseBase: { channel: 'telegram' },
    sentIdsResponseKey: 'sentMessageIds',
    textLimit: TELEGRAM_TEXT_CHUNK_LIMIT,
    sendText: async (chunk) => {
      const sent = await telegramApi(token, 'sendMessage', {
        chat_id: config.chatId,
        text: chunk,
        disable_web_page_preview: true,
        ...(typeof config.messageThreadId === 'number'
          ? { message_thread_id: config.messageThreadId }
          : {}),
      });
      return telegramMessageId(sent);
    },
    sendMedia: async ({ attachment, filename, media }) => {
      const sent = await telegramUpload(token, {
        attachment,
        chatId: config.chatId,
        filename,
        media,
        messageThreadId: config.messageThreadId,
      });
      return telegramMessageId(sent);
    },
  });

  return {
    externalMessageId: delivery.latestMessageId,
    externalMessageUrl: null,
    response: delivery.response,
  };
}

async function sendDiscordDigest(
  target: SalesDigestDeliveryTarget,
  digestRender: NamefiFeedSalesDigestRenderResult,
  at: Date,
): Promise<{
  externalMessageId: string;
  externalMessageUrl: string;
  response: Record<string, Json>;
}> {
  const token = secrets.DISCORD_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'DISCORD_BOT_TOKEN is required for Discord digest targets.',
    );
  }

  const config = parseSalesDigestTargetConfig(
    'discord_channel',
    target.config,
  ) as SalesDigestDiscordTargetConfig;
  const delivery = await sendMultipartSalesDigest({
    at,
    channelLabel: 'Discord',
    digestRender,
    emptyDeliveryMessage: 'Discord digest target produced no messages.',
    responseBase: {
      channel: 'discord',
      channelId: config.channelId,
      guildId: config.guildId ?? null,
    },
    sentIdsResponseKey: 'sentMessageIds',
    textLimit: DISCORD_TEXT_CHUNK_LIMIT,
    sendText: async (chunk) => {
      const sent = await discordJsonApi<{
        id: string;
      }>(token, config.channelId, {
        content: chunk,
        allowed_mentions: { parse: [] },
        flags: DISCORD_SUPPRESS_EMBEDS_FLAG,
      });
      return sent.id;
    },
    sendMedia: async ({ attachment, filename, media }) => {
      const sent = await discordUpload(token, config.channelId, {
        attachment,
        filename,
        media,
      });
      return sent.id;
    },
  });

  return {
    externalMessageId: delivery.latestMessageId,
    externalMessageUrl: buildDiscordMessageUrl({
      channelId: config.channelId,
      guildId: config.guildId ?? null,
      messageId: delivery.latestMessageId,
    }),
    response: delivery.response,
  };
}

async function sendMultipartSalesDigest({
  at,
  channelLabel,
  digestRender,
  emptyDeliveryMessage,
  responseBase,
  sendMedia,
  sendText,
  sentIdsResponseKey,
  textLimit,
}: {
  at: Date;
  channelLabel: string;
  digestRender: NamefiFeedSalesDigestRenderResult;
  emptyDeliveryMessage: string;
  responseBase: Record<string, Json>;
  sendMedia: (params: {
    attachment: SalesDigestMediaAttachment;
    filename: string;
    media: SalesDigestLoadedImage;
  }) => Promise<string>;
  sendText: (chunk: string) => Promise<string>;
  sentIdsResponseKey: string;
  textLimit: number;
}): Promise<{
  latestMessageId: string;
  response: Record<string, Json>;
}> {
  const textChunks = splitDigestTargetText(
    buildSalesDigestTargetText(digestRender),
    textLimit,
  );
  const mediaPlan = buildSalesDigestMediaPlan(digestRender);
  const sentIds: string[] = [];
  const sentLogoDomains: string[] = [];
  let latestMessageId: string | null = null;

  try {
    const heroMessageId = await sendHeroMediaWithFallback({
      at,
      channelLabel,
      mediaPlan,
      sendMedia,
    });
    if (heroMessageId) {
      latestMessageId = heroMessageId;
      sentIds.push(latestMessageId);
    }

    for (const chunk of textChunks) {
      latestMessageId = await sendText(chunk);
      sentIds.push(latestMessageId);
    }

    for (const logo of mediaPlan.topPickLogos) {
      const image = await loadSalesDigestImageAttachment(logo);
      if (!image) {
        continue;
      }

      latestMessageId = await sendMedia({
        attachment: logo,
        filename: buildSalesDigestMediaFilename(logo, at, image.extension),
        media: image,
      });
      sentIds.push(latestMessageId);
      sentLogoDomains.push(logo.domain);
    }
  } catch (error) {
    if (sentIds.length > 0) {
      const reason = formatErrorMessage(
        error,
        `${channelLabel} digest delivery failed after partial delivery.`,
      );
      throw new SalesDigestTargetPartialDeliveryError({
        externalMessageId: latestMessageId,
        message: `${channelLabel} digest target partially delivered; manual resolution required. ${reason}`,
        response: buildMultipartDeliveryResponse({
          responseBase,
          sentIds,
          sentIdsResponseKey,
          sentLogoDomains,
          partial: true,
          failureReason: reason,
        }),
      });
    }
    throw error;
  }

  if (!latestMessageId) {
    throw new Error(emptyDeliveryMessage);
  }

  return {
    latestMessageId,
    response: buildMultipartDeliveryResponse({
      responseBase,
      sentIds,
      sentIdsResponseKey,
      sentLogoDomains,
    }),
  };
}

async function sendHeroMediaWithFallback({
  at,
  channelLabel,
  mediaPlan,
  sendMedia,
}: {
  at: Date;
  channelLabel: string;
  mediaPlan: ReturnType<typeof buildSalesDigestMediaPlan>;
  sendMedia: (params: {
    attachment: SalesDigestHeroMediaAttachment;
    filename: string;
    media: SalesDigestLoadedImage;
  }) => Promise<string>;
}): Promise<string | null> {
  const candidates = buildHeroMediaFallbacks(mediaPlan);
  let videoError: unknown = null;

  for (const candidate of candidates) {
    const media = await loadSalesDigestHeroMediaAttachment(candidate);
    if (!media) {
      if (candidate.kind === 'hero_animation') {
        videoError = new Error(
          `${channelLabel} digest video could not be loaded.`,
        );
        continue;
      }
      throw buildHeroMediaFallbackError(channelLabel, videoError);
    }

    try {
      return await sendMedia({
        attachment: candidate,
        filename: buildSalesDigestMediaFilename(candidate, at, media.extension),
        media,
      });
    } catch (error) {
      if (candidate.kind === 'hero_animation') {
        videoError = error;
        continue;
      }
      throw buildHeroMediaFallbackError(channelLabel, videoError, error);
    }
  }

  return null;
}

function buildSalesDigestPayloadHashInput(
  digestRender: NamefiFeedSalesDigestRenderResult,
): string {
  const mediaPlan = buildSalesDigestMediaPlan(digestRender);
  const animation = digestRender.animation;

  return JSON.stringify({
    deliverySchemaVersion: 1,
    text: digestRender.text.trim(),
    targetText: buildSalesDigestTargetText(digestRender),
    animation: animation
      ? {
          id: animation.id,
          urlHash: hashDigestPayload(animation.url),
          storagePath: animation.storagePath,
          mimeType: animation.mimeType,
        }
      : null,
    imageDataUrlHash: digestRender.imageDataUrl
      ? hashDigestPayload(digestRender.imageDataUrl)
      : null,
    mediaPlan: {
      heroImage: mediaPlan.heroImage
        ? {
            dataUrlHash: hashDigestPayload(mediaPlan.heroImage.dataUrl),
          }
        : null,
      topPickLogos: mediaPlan.topPickLogos.map((logo) => ({
        domain: logo.domain,
        logoUrl: logo.logoUrl,
      })),
    },
    topPicks: digestRender.topPicks.map((pick) => ({
      domain: pick.domain,
      thesis: pick.thesis,
      tweetTake: pick.tweetTake ?? null,
      tweetPoints: pick.tweetPoints ?? [],
      sourceTweetUrl: pick.sourceTweetUrl ?? null,
      logoUrl: pick.logoUrl ?? null,
    })),
  });
}

function buildPlainTopPickDetails(
  topPicks: ReadonlyArray<NamefiFeedSalesDigestFormattedPick>,
): string | null {
  const lines = ['Why these stand out'];
  for (const [index, pick] of topPicks.slice(0, 3).entries()) {
    const domain = normalizeOptionalText(pick.domain);
    if (!domain) {
      continue;
    }

    const take = normalizeNamefiFeedSalesDigestTake(
      domain,
      pick.tweetTake ?? pick.thesis,
    );
    lines.push(`${index + 1}. ${domain} - ${take}`);

    for (const point of (pick.tweetPoints ?? []).slice(0, 2)) {
      const normalizedPoint = normalizeNamefiFeedSalesDigestPoint(
        domain,
        point,
      );
      if (normalizedPoint) {
        lines.push(`   - ${normalizedPoint}`);
      }
    }
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

function buildSlackDigestComment(
  digestRender: NamefiFeedSalesDigestRenderResult,
): string {
  return buildSalesDigestTargetText(digestRender);
}

function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = {},
  timeoutMs = SALES_DIGEST_OUTBOUND_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return fetch(input, {
    ...init,
    signal: init.signal
      ? AbortSignal.any([init.signal, timeoutSignal])
      : timeoutSignal,
  });
}

async function uploadSlackHeroMediaWithFallback({
  at,
  channelId,
  comment,
  mediaPlan,
  token,
}: {
  at: Date;
  channelId: string;
  comment: string;
  mediaPlan: ReturnType<typeof buildSalesDigestMediaPlan>;
  token: string;
}): Promise<{
  fileId: string;
  mediaKind: SalesDigestHeroMediaAttachment['kind'];
}> {
  const candidates = buildHeroMediaFallbacks(mediaPlan);
  let videoError: unknown = null;

  for (const candidate of candidates) {
    const media = await loadSalesDigestHeroMediaAttachment(candidate);
    if (!media) {
      if (candidate.kind === 'hero_animation') {
        videoError = new Error('Slack digest video could not be loaded.');
        continue;
      }
      throw buildHeroMediaFallbackError('Slack', videoError);
    }

    try {
      const fileId = await uploadSlackFileWithComment({
        at,
        attachment: candidate,
        channelId,
        comment,
        media,
        token,
      });
      return { fileId, mediaKind: candidate.kind };
    } catch (error) {
      if (candidate.kind === 'hero_animation') {
        videoError = error;
        continue;
      }
      throw buildHeroMediaFallbackError('Slack', videoError, error);
    }
  }

  throw buildHeroMediaFallbackError('Slack', videoError);
}

async function uploadSlackFileWithComment({
  at,
  attachment,
  channelId,
  comment,
  media,
  token,
}: {
  at: Date;
  attachment: SalesDigestMediaAttachment;
  channelId: string;
  comment: string;
  media: SalesDigestLoadedImage;
  token: string;
}): Promise<string> {
  const filename = buildSalesDigestMediaFilename(
    attachment,
    at,
    media.extension,
  );
  const upload = slackUploadUrlResponseSchema.parse(
    await slackApi<unknown>(token, 'files.getUploadURLExternal', {
      filename,
      length: media.bytes.length,
    }),
  );
  const uploadUrl = upload.upload_url;
  const fileId = upload.file_id;

  const uploadResponse = await fetchWithTimeout(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': media.mimeType,
    },
    body: Buffer.from(media.bytes),
  });
  if (!uploadResponse.ok) {
    throw new Error(
      `Slack file upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`,
    );
  }

  await slackApi(token, 'files.completeUploadExternal', {
    files: [{ id: fileId, title: attachment.title }],
    channel_id: channelId,
    initial_comment: comment,
  });

  return fileId;
}

async function sendSlackTextMessage({
  channelId,
  text,
  token,
}: {
  channelId: string;
  text: string;
  token: string;
}): Promise<string> {
  const response = slackPostMessageResponseSchema.parse(
    await slackApi<unknown>(token, 'chat.postMessage', {
      channel: channelId,
      text,
      unfurl_links: false,
      unfurl_media: false,
    }),
  );

  return `${response.channel}:${response.ts}`;
}

async function slackApi<T>(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetchWithTimeout(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { ok?: boolean; error?: string } & T;
  if (!response.ok || !json.ok) {
    throw new Error(
      `Slack API ${method} failed: ${json.error ?? response.status}`,
    );
  }

  return json;
}

async function telegramApi(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetchWithTimeout(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const json = (await response.json()) as { ok?: boolean; result?: unknown };
  if (!response.ok || !json.ok) {
    throw new Error(`Telegram API ${method} failed.`);
  }
  return json.result;
}

async function telegramUpload(
  token: string,
  input: {
    attachment: SalesDigestMediaAttachment;
    chatId: string;
    filename: string;
    media: SalesDigestLoadedImage;
    messageThreadId?: number | null;
  },
): Promise<unknown> {
  const isVideo = input.attachment.kind === 'hero_animation';
  const form = new FormData();
  form.set('chat_id', input.chatId);
  form.set('caption', input.attachment.caption);
  if (typeof input.messageThreadId === 'number') {
    form.set('message_thread_id', String(input.messageThreadId));
  }
  form.set(
    isVideo ? 'video' : 'photo',
    new Blob([Buffer.from(input.media.bytes)], { type: input.media.mimeType }),
    input.filename,
  );

  const response = await fetchWithTimeout(
    `https://api.telegram.org/bot${token}/${isVideo ? 'sendVideo' : 'sendPhoto'}`,
    {
      method: 'POST',
      body: form,
    },
  );
  const json = (await response.json()) as { ok?: boolean; result?: unknown };
  if (!response.ok || !json.ok) {
    throw new Error('Telegram media upload failed.');
  }
  return json.result;
}

function telegramMessageId(result: unknown): string {
  const parsed = z
    .object({
      message_id: z.number(),
      chat: z.object({
        id: z.union([z.number(), z.string()]),
      }),
    })
    .passthrough()
    .parse(result);

  return `${parsed.chat.id}:${parsed.message_id}`;
}

async function discordJsonApi<T>(
  token: string,
  channelId: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetchWithTimeout(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Discord API failed: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

async function discordUpload(
  token: string,
  channelId: string,
  input: {
    attachment: SalesDigestMediaAttachment;
    filename: string;
    media: SalesDigestLoadedImage;
  },
): Promise<{ id: string }> {
  const form = new FormData();
  form.set(
    'payload_json',
    JSON.stringify({
      allowed_mentions: { parse: [] },
      attachments: [
        {
          description: input.attachment.altText,
          filename: input.filename,
          id: 0,
        },
      ],
    }),
  );
  form.set(
    'files[0]',
    new Blob([Buffer.from(input.media.bytes)], { type: input.media.mimeType }),
    input.filename,
  );

  const response = await fetchWithTimeout(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${token}`,
      },
      body: form,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Discord media upload failed: ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as { id: string };
}

function buildDiscordMessageUrl({
  channelId,
  guildId,
  messageId,
}: {
  channelId: string;
  guildId: string | null;
  messageId: string;
}): string {
  return `https://discord.com/channels/${guildId ?? '@me'}/${channelId}/${messageId}`;
}

function buildHeroMediaFallbacks(
  mediaPlan: ReturnType<typeof buildSalesDigestMediaPlan>,
): SalesDigestHeroMediaAttachment[] {
  return [mediaPlan.heroAnimation, mediaPlan.heroImage].filter(
    (candidate): candidate is SalesDigestHeroMediaAttachment =>
      Boolean(candidate),
  );
}

function buildHeroMediaFallbackError(
  channel: string,
  videoError: unknown,
  imageError?: unknown,
): Error {
  const videoMessage = formatUnknownError(videoError);
  const imageMessage = formatUnknownError(imageError);
  if (videoMessage && imageMessage) {
    return new Error(
      `${channel} digest video and image delivery failed. Video: ${videoMessage}. Image: ${imageMessage}`,
    );
  }
  if (videoMessage) {
    return new Error(
      `${channel} digest video delivery failed and no image fallback was available. Video: ${videoMessage}`,
    );
  }
  return new Error(`${channel} digest media was not generated.`);
}

function buildMultipartDeliveryResponse({
  failureReason,
  partial,
  responseBase,
  sentIds,
  sentIdsResponseKey,
  sentLogoDomains,
}: {
  failureReason?: string;
  partial?: boolean;
  responseBase: Record<string, Json>;
  sentIds: string[];
  sentIdsResponseKey: string;
  sentLogoDomains: string[];
}): Record<string, Json> {
  return {
    ...responseBase,
    ...(partial ? { partial: true } : {}),
    [sentIdsResponseKey]: sentIds,
    sentLogoDomains,
    ...(failureReason ? { failureReason } : {}),
  };
}

function hashDigestPayload(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function summarizeDeliveries(
  deliveries: SalesDigestTargetDeliveryResult[],
): SalesDigestTargetDeliverySummary {
  return {
    deliveries,
    failed: deliveries.filter((delivery) => delivery.status === 'failed')
      .length,
    sent: deliveries.filter((delivery) => delivery.status === 'sent').length,
    skipped: deliveries.filter((delivery) => delivery.status === 'skipped')
      .length,
    targetCount: deliveries.length,
  };
}

function defaultTargetLabel(input: CreateSalesDigestTargetInput): string {
  switch (input.targetType) {
    case 'slack': {
      const config = parseSalesDigestTargetConfig(
        input.targetType,
        input.config,
      ) as SalesDigestSlackTargetConfig;
      return `Slack ${config.channelId}`;
    }
    case 'telegram_group': {
      const config = parseSalesDigestTargetConfig(
        input.targetType,
        input.config,
      ) as SalesDigestTelegramTargetConfig;
      return `Telegram ${config.chatId}`;
    }
    case 'discord_channel': {
      const config = parseSalesDigestTargetConfig(
        input.targetType,
        input.config,
      ) as SalesDigestDiscordTargetConfig;
      return `Discord ${config.channelId}`;
    }
  }
}

function findChunkBreakpoint(value: string, maxLength: number): number {
  const candidates = [
    value.lastIndexOf('\n\n', maxLength),
    value.lastIndexOf('\n', maxLength),
    value.lastIndexOf(' ', maxLength),
  ].filter((index) => index > maxLength * 0.6);

  return candidates[0] ?? maxLength;
}

function persistedTargetKey(id: string): `target:${string}` {
  return `target:${id}`;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function formatUnknownError(error: unknown): string | null {
  if (!error) {
    return null;
  }
  return error instanceof Error ? error.message : String(error);
}

function formatErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
