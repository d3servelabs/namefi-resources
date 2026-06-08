import {
  LEADGEN_EMAIL_MODEL,
  generateLeadgenContacts,
  generateLeadgenEmailDraft,
  getLeadgenContactModel,
  normalizeLeadgenEmail,
  type LeadgenContact,
  type LeadgenReasoningEffort,
} from '@namefi-astra/ai';
import {
  db,
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenEventsTable,
  leadgenLeadSignalsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
  userContactsTable,
} from '@namefi-astra/db';
import { and, count, desc, eq, isNull, ne, or, sql } from 'drizzle-orm';
import { getLeadgenRunCounts } from '#lib/leadgen/snapshot';
import { createLogger } from '#lib/logger';
import { appendLeadgenTokenUsageFromResult } from './token-usage';

type LeadRow = typeof leadgenLeadsTable.$inferSelect;
type ContactRow = typeof leadgenContactsTable.$inferSelect;
type LeadgenOutreachTrigger = 'auto' | 'manual';
export type LeadgenSender = { signature: string | null };

const logger = createLogger({ module: 'leadgen-outreach' });
const selectLeadgenContactFields = {
  id: leadgenContactsTable.id,
  leadId: leadgenContactsTable.leadId,
  email: leadgenContactsTable.email,
  name: leadgenContactsTable.name,
  title: leadgenContactsTable.title,
  sourceUrl: leadgenContactsTable.sourceUrl,
  context: leadgenContactsTable.context,
  metadata: leadgenContactsTable.metadata,
  createdAt: leadgenContactsTable.createdAt,
  updatedAt: leadgenContactsTable.updatedAt,
};
export interface GenerateLeadgenLeadOutreachInput {
  runId: string;
  leadId: string;
  sourceDomain: string;
  reasoningEffort: LeadgenReasoningEffort;
  abortSignal?: AbortSignal;
}

export interface DiscoverLeadgenContactsAndDraftInput {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  trigger?: LeadgenOutreachTrigger;
  draftEmails?: boolean;
  sender?: LeadgenSender;
  abortSignal?: AbortSignal;
}

export async function generateLeadgenLeadOutreach({
  runId,
  leadId,
  sourceDomain,
  reasoningEffort,
  abortSignal = new AbortController().signal,
}: GenerateLeadgenLeadOutreachInput) {
  const lead = await db.query.leadgenLeadsTable.findFirst({
    where: and(
      eq(leadgenLeadsTable.runId, runId),
      eq(leadgenLeadsTable.id, leadId),
    ),
  });

  if (!lead) {
    throw new Error('Lead not found for this run');
  }

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'contacts',
    message: `Finding contacts and drafting outreach for ${lead.businessDomain}.`,
    payload: {
      leadId: lead.id,
      businessDomain: lead.businessDomain,
      trigger: 'manual',
    },
  });

  await discoverLeadgenContactsAndDraft({
    runId,
    sourceDomain,
    lead,
    reasoningEffort,
    trigger: 'manual',
    abortSignal,
  });

  const counts = await getLeadgenRunCounts(runId);
  const leadOutreachCounts = await countLeadOutreach({
    leadId: lead.id,
  });

  await persistLeadgenEvent({
    runId,
    eventType: 'status',
    stage: 'contacts',
    message: `Finished outreach prep for ${lead.businessDomain}.`,
    payload: {
      leadId: lead.id,
      businessDomain: lead.businessDomain,
      trigger: 'manual',
      leadContactCount: leadOutreachCounts.contactCount,
      leadDraftCount: leadOutreachCounts.draftCount,
      ...counts,
    },
  });

  return counts;
}

export async function discoverLeadgenContactsAndDraft({
  abortSignal = new AbortController().signal,
  ...params
}: DiscoverLeadgenContactsAndDraftInput) {
  const sender =
    params.sender ?? (await loadLeadgenSenderForRun({ runId: params.runId }));
  const existingContacts = await loadCurrentContactsForLead({
    leadId: params.lead.id,
  });

  if (existingContacts.length > 0) {
    await markLeadContactDiscoveryAttempted({ leadId: params.lead.id });
    if (params.draftEmails === false) return;

    await draftForSavedContacts({
      ...params,
      sender,
      contacts: existingContacts,
      abortSignal,
    });
    return;
  }

  const cachedContacts = await loadCachedContactsForDomain({
    runId: params.runId,
    businessDomain: params.lead.businessDomain,
  });

  if (cachedContacts.length > 0) {
    await persistCachedContactsAndDraft({
      ...params,
      sender,
      cachedContacts,
      abortSignal,
    });
    return;
  }

  await discoverNewContactsAndDraft({ ...params, sender, abortSignal });
}

async function countLeadOutreach(params: { leadId: string }) {
  const [[contactCountRow], [draftCountRow]] = await Promise.all([
    db
      .select({ value: count() })
      .from(leadgenContactsTable)
      .where(eq(leadgenContactsTable.leadId, params.leadId)),
    db
      .select({ value: count() })
      .from(leadgenEmailDraftsTable)
      .innerJoin(
        leadgenContactsTable,
        eq(leadgenEmailDraftsTable.contactId, leadgenContactsTable.id),
      )
      .where(eq(leadgenContactsTable.leadId, params.leadId)),
  ]);

  return {
    contactCount: contactCountRow?.value ?? 0,
    draftCount: draftCountRow?.value ?? 0,
  };
}

export async function loadLeadgenSenderForRun(params: {
  runId: string;
}): Promise<LeadgenSender> {
  const [run] = await db
    .select({ userId: leadgenRunsTable.userId })
    .from(leadgenRunsTable)
    .where(eq(leadgenRunsTable.id, params.runId))
    .limit(1);
  if (!run) return { signature: null };

  const [contact] = await db
    .select({
      firstName: userContactsTable.firstName,
      lastName: userContactsTable.lastName,
      organizationName: userContactsTable.organizationName,
    })
    .from(userContactsTable)
    .where(
      and(
        eq(userContactsTable.userId, run.userId),
        or(
          hasText(userContactsTable.firstName),
          hasText(userContactsTable.lastName),
          hasText(userContactsTable.organizationName),
        ),
      ),
    )
    .orderBy(
      desc(userContactsTable.updatedAt),
      desc(userContactsTable.createdAt),
      desc(userContactsTable.id),
    )
    .limit(1);

  return {
    signature:
      getFullName(contact) ??
      cleanNullableString(contact?.organizationName) ??
      null,
  };
}

function getFullName(
  contact:
    | {
        firstName: string | null;
        lastName: string | null;
      }
    | null
    | undefined,
) {
  const name = [contact?.firstName, contact?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  return name || null;
}

function cleanNullableString(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function hasText(
  column:
    | typeof userContactsTable.firstName
    | typeof userContactsTable.lastName
    | typeof userContactsTable.organizationName,
) {
  return sql<boolean>`NULLIF(TRIM(${column}), '') IS NOT NULL`;
}

export async function persistLeadgenEvent(params: {
  runId: string;
  eventType: string;
  stage?: string;
  message?: string;
  payload?: Record<string, unknown>;
}) {
  await db.insert(leadgenEventsTable).values({
    runId: params.runId,
    eventType: params.eventType,
    stage: params.stage ?? null,
    message: params.message ?? null,
    payload: params.payload ?? {},
  });
}

async function draftForSavedContacts(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  trigger?: LeadgenOutreachTrigger;
  sender: LeadgenSender;
  abortSignal: AbortSignal;
  contacts: ContactRow[];
}) {
  for (const contact of params.contacts) {
    throwIfLeadgenAborted(params.abortSignal);

    try {
      await draftForContact({
        runId: params.runId,
        sourceDomain: params.sourceDomain,
        lead: params.lead,
        contact,
        reasoningEffort: params.reasoningEffort,
        sender: params.sender,
        fromCache: isLeadgenFromCacheMetadata(contact.metadata),
        trigger: params.trigger ?? 'auto',
        abortSignal: params.abortSignal,
      });
    } catch (error) {
      throwIfLeadgenAborted(params.abortSignal);

      logger.warn(
        {
          error,
          runId: params.runId,
          leadId: params.lead.id,
          contactId: contact.id,
          contactEmail: contact.email,
        },
        'Leadgen email draft failed for contact',
      );
      await persistLeadgenEvent({
        runId: params.runId,
        eventType: 'error',
        stage: 'drafts',
        payload: {
          leadId: params.lead.id,
          contactId: contact.id,
          businessDomain: params.lead.businessDomain,
          contactEmail: contact.email,
          error: getLeadgenErrorMessage(error),
          trigger: params.trigger ?? 'auto',
        },
      });
    }
  }
}

async function persistCachedContactsAndDraft(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  trigger?: LeadgenOutreachTrigger;
  draftEmails?: boolean;
  sender: LeadgenSender;
  abortSignal: AbortSignal;
  cachedContacts: ContactRow[];
}) {
  const savedContacts: ContactRow[] = [];

  for (const cached of params.cachedContacts) {
    throwIfLeadgenAborted(params.abortSignal);

    const contact = await upsertContact({
      runId: params.runId,
      leadId: params.lead.id,
      businessDomain: params.lead.businessDomain,
      contact: {
        email: cached.email,
        name: cached.name ?? null,
        title: cached.title ?? null,
        sourceUrl: cached.sourceUrl ?? null,
        context: cached.context ?? null,
      },
      notes: getLeadgenContactDiscoveryNotesMetadata(cached.metadata),
      fromCache: true,
      trigger: params.trigger ?? 'auto',
    });
    savedContacts.push(contact);
  }

  await markLeadContactDiscoveryAttempted({ leadId: params.lead.id });

  if (params.draftEmails === false) return;

  for (const contact of savedContacts) {
    throwIfLeadgenAborted(params.abortSignal);

    await draftForContact({
      runId: params.runId,
      sourceDomain: params.sourceDomain,
      lead: params.lead,
      contact,
      reasoningEffort: params.reasoningEffort,
      sender: params.sender,
      fromCache: true,
      trigger: params.trigger ?? 'auto',
      abortSignal: params.abortSignal,
    });
  }
}

async function discoverNewContactsAndDraft(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  trigger?: LeadgenOutreachTrigger;
  draftEmails?: boolean;
  sender: LeadgenSender;
  abortSignal: AbortSignal;
}) {
  try {
    const result = await generateLeadgenContacts(
      [{ domain: params.lead.businessDomain }],
      {
        abortSignal: params.abortSignal,
        reasoningEffort: params.reasoningEffort,
      },
    );
    await recordLeadgenTokenUsageFromResult({
      runId: params.runId,
      result,
      fallbackModel: getLeadgenContactModel(params.reasoningEffort),
    });
    const contactResult = result.output[0];
    const contacts = contactResult?.contacts ?? [];

    if (contacts.length === 0) {
      await markLeadContactDiscoveryAttempted({ leadId: params.lead.id });
      await persistLeadgenEvent({
        runId: params.runId,
        eventType: 'contact',
        stage: 'contacts',
        payload: {
          leadId: params.lead.id,
          businessDomain: params.lead.businessDomain,
          notes: contactResult?.notes ?? null,
          trigger: params.trigger ?? 'auto',
        },
      });
      return;
    }

    const savedContacts = await Promise.all(
      contacts.map((contact) =>
        upsertContact({
          runId: params.runId,
          leadId: params.lead.id,
          businessDomain: params.lead.businessDomain,
          contact,
          notes: contactResult?.notes ?? undefined,
          fromCache: false,
          trigger: params.trigger ?? 'auto',
        }),
      ),
    );

    await markLeadContactDiscoveryAttempted({ leadId: params.lead.id });

    if (params.draftEmails === false) return;

    await draftForSavedContacts({
      ...params,
      contacts: savedContacts,
    });
  } catch (error) {
    throwIfLeadgenAborted(params.abortSignal);

    await markLeadContactDiscoveryAttempted({ leadId: params.lead.id });
    await persistLeadgenEvent({
      runId: params.runId,
      eventType: 'error',
      stage: 'contacts',
      payload: {
        leadId: params.lead.id,
        businessDomain: params.lead.businessDomain,
        error: getLeadgenErrorMessage(error),
        trigger: params.trigger ?? 'auto',
      },
    });
  }
}

async function loadCurrentContactsForLead(params: { leadId: string }) {
  return await db
    .select(selectLeadgenContactFields)
    .from(leadgenContactsTable)
    .where(eq(leadgenContactsTable.leadId, params.leadId))
    .orderBy(desc(leadgenContactsTable.createdAt));
}

async function loadCachedContactsForDomain(params: {
  runId: string;
  businessDomain: string;
}) {
  return await db
    .select(selectLeadgenContactFields)
    .from(leadgenContactsTable)
    .innerJoin(
      leadgenLeadsTable,
      eq(leadgenContactsTable.leadId, leadgenLeadsTable.id),
    )
    .where(
      and(
        eq(leadgenLeadsTable.businessDomain, params.businessDomain),
        ne(leadgenLeadsTable.runId, params.runId),
      ),
    )
    .orderBy(desc(leadgenContactsTable.createdAt))
    .limit(3);
}

async function upsertContact(params: {
  runId: string;
  leadId: string;
  businessDomain: string;
  contact: LeadgenContact;
  notes?: string;
  fromCache: boolean;
  trigger: LeadgenOutreachTrigger;
}) {
  const email = normalizeLeadgenEmail(params.contact.email);
  if (!email) {
    throw new Error('Contact email is invalid');
  }

  const [saved] = await db
    .insert(leadgenContactsTable)
    .values({
      leadId: params.leadId,
      email,
      name: params.contact.name ?? null,
      title: params.contact.title ?? null,
      sourceUrl: params.contact.sourceUrl ?? null,
      context: params.contact.context ?? null,
      metadata: buildLeadgenContactMetadata({
        fromCache: params.fromCache,
        notes: params.notes,
      }),
    })
    .onConflictDoUpdate({
      target: [leadgenContactsTable.leadId, leadgenContactsTable.email],
      set: {
        name: coalesceIncomingContactField(
          params.contact.name,
          leadgenContactsTable.name,
        ),
        title: coalesceIncomingContactField(
          params.contact.title,
          leadgenContactsTable.title,
        ),
        sourceUrl: coalesceIncomingContactField(
          params.contact.sourceUrl,
          leadgenContactsTable.sourceUrl,
        ),
        context: coalesceIncomingContactField(
          params.contact.context,
          leadgenContactsTable.context,
        ),
        metadata: mergeLeadgenContactMetadata(leadgenContactsTable.metadata, {
          fromCache: params.fromCache,
          notes: params.notes,
        }),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!saved) {
    throw new Error('Failed to persist contact');
  }

  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'contact',
    stage: 'contacts',
    message: `Found ${email} for ${params.businessDomain}.`,
    payload: {
      leadId: params.leadId,
      contactId: saved.id,
      businessDomain: params.businessDomain,
      email,
      name: saved.name,
      title: saved.title,
      fromCache: params.fromCache,
      trigger: params.trigger,
    },
  });

  return saved;
}

async function draftForContact(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  contact: ContactRow;
  reasoningEffort: LeadgenReasoningEffort;
  sender: LeadgenSender;
  fromCache: boolean;
  trigger: LeadgenOutreachTrigger;
  abortSignal: AbortSignal;
}) {
  throwIfLeadgenAborted(params.abortSignal);

  const existing = await db.query.leadgenEmailDraftsTable.findFirst({
    where: eq(leadgenEmailDraftsTable.contactId, params.contact.id),
  });
  if (existing) return existing;

  const draft = await generateLeadgenEmailDraft(
    {
      sourceDomain: params.sourceDomain,
      sender: params.sender,
      prospect: {
        domain: params.lead.businessDomain,
        content: params.lead.content,
        rationale: params.lead.rationale,
        signals: await loadLeadSignalsForDraft(params.lead.id),
      },
      contact: {
        email: params.contact.email,
        name: params.contact.name ?? null,
        title: params.contact.title ?? null,
        sourceUrl: params.contact.sourceUrl ?? null,
        context: params.contact.context ?? null,
      },
    },
    {
      abortSignal: params.abortSignal,
      // Drafting is deterministic copywriting from supplied evidence; keep it low effort for throughput.
      reasoningEffort: 'low',
    },
  );
  await recordLeadgenTokenUsageFromResult({
    runId: params.runId,
    result: draft,
    fallbackModel: LEADGEN_EMAIL_MODEL,
  });

  const [saved] = await db
    .insert(leadgenEmailDraftsTable)
    .values({
      contactId: params.contact.id,
      subject: draft.output.subject.trim(),
      fullEmail: draft.output.fullEmail.trim(),
      metadata: buildLeadgenFromCacheMetadata(params.fromCache),
    })
    .onConflictDoUpdate({
      target: [leadgenEmailDraftsTable.contactId],
      set: {
        subject: draft.output.subject.trim(),
        fullEmail: draft.output.fullEmail.trim(),
        metadata: mergeLeadgenFromCacheMetadata(
          leadgenEmailDraftsTable.metadata,
          params.fromCache,
        ),
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!saved) {
    throw new Error('Failed to persist email draft');
  }

  await persistLeadgenEvent({
    runId: params.runId,
    eventType: 'draft',
    stage: 'drafts',
    message: `Drafted outreach to ${params.contact.email}.`,
    payload: {
      leadId: params.lead.id,
      contactId: params.contact.id,
      draftId: saved.id,
      businessDomain: params.lead.businessDomain,
      contactEmail: params.contact.email,
      subject: saved.subject,
      fromCache: params.fromCache,
      trigger: params.trigger,
    },
  });

  return saved;
}

function isLeadgenFromCacheMetadata(metadata: unknown): boolean {
  return metadata && typeof metadata === 'object' && 'fromCache' in metadata
    ? (metadata as { fromCache?: unknown }).fromCache === true
    : false;
}

function getLeadgenContactDiscoveryNotesMetadata(metadata: unknown) {
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('contactDiscoveryNotes' in metadata)
  ) {
    return undefined;
  }

  const notes = (metadata as { contactDiscoveryNotes?: unknown })
    .contactDiscoveryNotes;
  return typeof notes === 'string'
    ? (cleanNullableString(notes) ?? undefined)
    : undefined;
}

function buildLeadgenContactMetadata(params: {
  fromCache: boolean;
  notes?: string;
}) {
  return {
    ...buildLeadgenFromCacheMetadata(params.fromCache),
    ...buildLeadgenContactDiscoveryNotesMetadata(params.notes),
  };
}

function buildLeadgenContactDiscoveryNotesMetadata(notes?: string) {
  const cleanNotes = cleanNullableString(notes);
  return cleanNotes ? { contactDiscoveryNotes: cleanNotes } : {};
}

function coalesceIncomingContactField<TColumn>(
  value: string | null | undefined,
  column: TColumn,
) {
  const cleanValue = cleanNullableString(value);
  return cleanValue ? sql`coalesce(${cleanValue}, ${column})` : column;
}

function buildLeadgenFromCacheMetadata(fromCache: boolean) {
  return fromCache ? { fromCache: true } : {};
}

function mergeLeadgenContactMetadata(
  column: typeof leadgenContactsTable.metadata,
  params: { fromCache: boolean; notes?: string },
) {
  const fromCacheExpression = mergeLeadgenFromCacheMetadata(
    column,
    params.fromCache,
  );
  const notesMetadata = buildLeadgenContactDiscoveryNotesMetadata(params.notes);

  if ('contactDiscoveryNotes' in notesMetadata) {
    return sql`${fromCacheExpression} || ${JSON.stringify(notesMetadata)}::jsonb`;
  }

  return fromCacheExpression;
}

function mergeLeadgenFromCacheMetadata(
  column:
    | typeof leadgenContactsTable.metadata
    | typeof leadgenEmailDraftsTable.metadata,
  fromCache: boolean,
) {
  if (fromCache) {
    return sql`coalesce(${column}, '{}'::jsonb) || '{"fromCache": true}'::jsonb`;
  }

  return sql`coalesce(${column}, '{}'::jsonb) - 'fromCache'`;
}

async function loadLeadSignalsForDraft(leadId: string) {
  const signals = await db
    .select({
      signalType: leadgenLeadSignalsTable.signalType,
      evidenceSnippet: leadgenLeadSignalsTable.evidenceSnippet,
      evidenceUrl: leadgenLeadSignalsTable.evidenceUrl,
    })
    .from(leadgenLeadSignalsTable)
    .where(eq(leadgenLeadSignalsTable.leadId, leadId))
    .orderBy(leadgenLeadSignalsTable.createdAt)
    .limit(5);

  return signals;
}

async function markLeadContactDiscoveryAttempted(params: { leadId: string }) {
  const attemptedAt = new Date();
  await db
    .update(leadgenLeadsTable)
    .set({
      contactDiscoveryAttemptedAt: attemptedAt,
      updatedAt: attemptedAt,
    })
    .where(
      and(
        eq(leadgenLeadsTable.id, params.leadId),
        isNull(leadgenLeadsTable.contactDiscoveryAttemptedAt),
      ),
    );
}

function throwIfLeadgenAborted(abortSignal: AbortSignal) {
  if (!abortSignal.aborted) {
    return;
  }

  throw abortSignal.reason instanceof Error
    ? abortSignal.reason
    : new Error('activity-cancelled');
}

export function getLeadgenErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function recordLeadgenTokenUsageFromResult(params: {
  runId: string;
  result: unknown;
  fallbackModel: string;
}) {
  try {
    await appendLeadgenTokenUsageFromResult(params);
  } catch (error) {
    logger.warn(
      { error, runId: params.runId, fallbackModel: params.fallbackModel },
      'Failed to persist leadgen token usage in outreach',
    );
    // Token usage is operational accounting; do not fail the user-facing
    // outreach path if the usage update races or fails transiently.
  }
}
