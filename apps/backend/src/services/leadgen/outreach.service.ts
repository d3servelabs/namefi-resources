import {
  generateLeadgenContacts,
  generateLeadgenEmailDraft,
  normalizeLeadgenEmail,
  type LeadgenContact,
  type LeadgenReasoningEffort,
} from '@namefi-astra/ai';
import {
  db,
  leadgenContactsTable,
  leadgenEmailDraftsTable,
  leadgenEventsTable,
  leadgenLeadsTable,
  leadgenRunsTable,
} from '@namefi-astra/db';
import { and, count, desc, eq, isNull, ne, or } from 'drizzle-orm';

type LeadRow = typeof leadgenLeadsTable.$inferSelect;
type ContactRow = typeof leadgenContactsTable.$inferSelect;
type LeadgenOutreachTrigger = 'auto' | 'manual';

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

  const counts = await refreshLeadgenRunCounts(runId);
  const leadOutreachCounts = await countLeadOutreach({
    runId,
    leadId: lead.id,
    businessDomain: lead.businessDomain,
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
  const existingContacts = await loadCurrentContactsForLead({
    runId: params.runId,
    leadId: params.lead.id,
    businessDomain: params.lead.businessDomain,
  });

  if (existingContacts.length > 0) {
    await draftForSavedContacts({
      ...params,
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
      cachedContacts,
      abortSignal,
    });
    return;
  }

  await discoverNewContactsAndDraft({ ...params, abortSignal });
}

export async function refreshLeadgenRunCounts(runId: string) {
  const [[leadCountRow], [contactCountRow], [draftCountRow]] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(leadgenLeadsTable)
        .where(eq(leadgenLeadsTable.runId, runId)),
      db
        .select({ value: count() })
        .from(leadgenContactsTable)
        .where(eq(leadgenContactsTable.runId, runId)),
      db
        .select({ value: count() })
        .from(leadgenEmailDraftsTable)
        .where(eq(leadgenEmailDraftsTable.runId, runId)),
    ]);

  const counts = {
    leadCount: leadCountRow?.value ?? 0,
    contactCount: contactCountRow?.value ?? 0,
    draftCount: draftCountRow?.value ?? 0,
  };

  await db
    .update(leadgenRunsTable)
    .set({ ...counts, updatedAt: new Date() })
    .where(eq(leadgenRunsTable.id, runId));

  return counts;
}

async function countLeadOutreach(params: {
  runId: string;
  leadId: string;
  businessDomain: string;
}) {
  // Mirror loadCurrentContactsForLead: NULL leadId rows are domain-level
  // cached outreach items that should count with this lead's assigned rows.
  const [[contactCountRow], [draftCountRow]] = await Promise.all([
    db
      .select({ value: count() })
      .from(leadgenContactsTable)
      .where(
        and(
          eq(leadgenContactsTable.runId, params.runId),
          eq(leadgenContactsTable.businessDomain, params.businessDomain),
          or(
            eq(leadgenContactsTable.leadId, params.leadId),
            isNull(leadgenContactsTable.leadId),
          ),
        ),
      ),
    db
      .select({ value: count() })
      .from(leadgenEmailDraftsTable)
      .where(
        and(
          eq(leadgenEmailDraftsTable.runId, params.runId),
          eq(leadgenEmailDraftsTable.businessDomain, params.businessDomain),
          or(
            eq(leadgenEmailDraftsTable.leadId, params.leadId),
            isNull(leadgenEmailDraftsTable.leadId),
          ),
        ),
      ),
  ]);

  return {
    contactCount: contactCountRow?.value ?? 0,
    draftCount: draftCountRow?.value ?? 0,
  };
}

export async function persistLeadgenEvent(params: {
  runId: string;
  eventType: string;
  stage?: string;
  message?: string;
  payload?: Record<string, unknown>;
  transient?: boolean;
}) {
  await db.insert(leadgenEventsTable).values({
    runId: params.runId,
    eventType: params.eventType,
    stage: params.stage ?? null,
    message: params.message ?? null,
    payload: params.payload ?? {},
    transient: params.transient ?? false,
  });
}

async function draftForSavedContacts(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  trigger?: LeadgenOutreachTrigger;
  abortSignal: AbortSignal;
  contacts: ContactRow[];
}) {
  for (const contact of params.contacts) {
    throwIfLeadgenAborted(params.abortSignal);

    await draftForContact({
      runId: params.runId,
      sourceDomain: params.sourceDomain,
      lead: params.lead,
      contact,
      reasoningEffort: params.reasoningEffort,
      fromCache: contact.fromCache,
      trigger: params.trigger ?? 'auto',
      abortSignal: params.abortSignal,
    });
  }
}

async function persistCachedContactsAndDraft(params: {
  runId: string;
  sourceDomain: string;
  lead: LeadRow;
  reasoningEffort: LeadgenReasoningEffort;
  trigger?: LeadgenOutreachTrigger;
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
      notes: cached.notes ?? undefined,
      fromCache: true,
      trigger: params.trigger ?? 'auto',
    });
    savedContacts.push(contact);
  }

  await refreshLeadgenRunCounts(params.runId);

  for (const contact of savedContacts) {
    throwIfLeadgenAborted(params.abortSignal);

    await draftForContact({
      runId: params.runId,
      sourceDomain: params.sourceDomain,
      lead: params.lead,
      contact,
      reasoningEffort: params.reasoningEffort,
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
  abortSignal: AbortSignal;
}) {
  try {
    const result = await generateLeadgenContacts(
      [{ domain: params.lead.businessDomain }],
      {
        abortSignal: params.abortSignal,
        reasoningEffort: params.reasoningEffort,
        targetContacts: 3,
      },
    );
    const contactResult = result.output[0];
    const contacts = contactResult?.contacts ?? [];

    if (contacts.length === 0) {
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

    await refreshLeadgenRunCounts(params.runId);

    const firstContact = savedContacts[0];
    if (!firstContact) return;

    await draftForContact({
      runId: params.runId,
      sourceDomain: params.sourceDomain,
      lead: params.lead,
      contact: firstContact,
      reasoningEffort: params.reasoningEffort,
      fromCache: false,
      trigger: params.trigger ?? 'auto',
      abortSignal: params.abortSignal,
    });
  } catch (error) {
    throwIfLeadgenAborted(params.abortSignal);

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

async function loadCurrentContactsForLead(params: {
  runId: string;
  leadId: string;
  businessDomain: string;
}) {
  return await db
    .select()
    .from(leadgenContactsTable)
    .where(
      and(
        eq(leadgenContactsTable.runId, params.runId),
        eq(leadgenContactsTable.businessDomain, params.businessDomain),
        or(
          eq(leadgenContactsTable.leadId, params.leadId),
          isNull(leadgenContactsTable.leadId),
        ),
      ),
    )
    .orderBy(desc(leadgenContactsTable.createdAt));
}

async function loadCachedContactsForDomain(params: {
  runId: string;
  businessDomain: string;
}) {
  return await db
    .select()
    .from(leadgenContactsTable)
    .where(
      and(
        eq(leadgenContactsTable.businessDomain, params.businessDomain),
        ne(leadgenContactsTable.runId, params.runId),
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
      runId: params.runId,
      leadId: params.leadId,
      businessDomain: params.businessDomain,
      email,
      name: params.contact.name ?? null,
      title: params.contact.title ?? null,
      sourceUrl: params.contact.sourceUrl ?? null,
      context: params.contact.context ?? null,
      notes: params.notes ?? null,
      fromCache: params.fromCache,
    })
    .onConflictDoUpdate({
      target: [
        leadgenContactsTable.runId,
        leadgenContactsTable.businessDomain,
        leadgenContactsTable.email,
      ],
      set: {
        leadId: params.leadId,
        name: params.contact.name ?? null,
        title: params.contact.title ?? null,
        sourceUrl: params.contact.sourceUrl ?? null,
        context: params.contact.context ?? null,
        notes: params.notes ?? null,
        fromCache: params.fromCache,
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
  fromCache: boolean;
  trigger: LeadgenOutreachTrigger;
  abortSignal: AbortSignal;
}) {
  throwIfLeadgenAborted(params.abortSignal);

  const existing = await db.query.leadgenEmailDraftsTable.findFirst({
    where: and(
      eq(leadgenEmailDraftsTable.runId, params.runId),
      eq(leadgenEmailDraftsTable.businessDomain, params.lead.businessDomain),
      eq(leadgenEmailDraftsTable.contactEmail, params.contact.email),
    ),
  });
  if (existing) return existing;

  const draft = await generateLeadgenEmailDraft(
    {
      sourceDomain: params.sourceDomain,
      prospect: {
        domain: params.lead.businessDomain,
        content: params.lead.content,
        rationale: params.lead.rationale,
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
      reasoningEffort: params.reasoningEffort,
    },
  );

  const [saved] = await db
    .insert(leadgenEmailDraftsTable)
    .values({
      runId: params.runId,
      leadId: params.lead.id,
      contactId: params.contact.id,
      businessDomain: params.lead.businessDomain,
      contactEmail: params.contact.email,
      subject: draft.output.subject.trim(),
      fullEmail: draft.output.fullEmail.trim(),
      fromCache: params.fromCache,
    })
    .onConflictDoUpdate({
      target: [
        leadgenEmailDraftsTable.runId,
        leadgenEmailDraftsTable.businessDomain,
        leadgenEmailDraftsTable.contactEmail,
      ],
      set: {
        subject: draft.output.subject.trim(),
        fullEmail: draft.output.fullEmail.trim(),
        fromCache: params.fromCache,
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

  await refreshLeadgenRunCounts(params.runId);

  return saved;
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
