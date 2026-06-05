import type { z } from 'zod';
import type {
  leadgenReasoningEffortSchema,
  leadgenRunStatusSchema,
} from '@namefi-astra/common/contract/leadgen-contract';

type LeadgenRunStatus = z.infer<typeof leadgenRunStatusSchema>;
type LeadgenReasoningEffort = z.infer<typeof leadgenReasoningEffortSchema>;

export type OutboundRunSource = {
  id: string;
  domain: string;
  status: LeadgenRunStatus;
  reasoningEffort: LeadgenReasoningEffort;
  leadCount: number;
  contactCount: number;
  draftCount: number;
  summary: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type OutboundLeadSource = {
  id: string;
  businessDomain: string;
  rationale: string | null;
  content: string | null;
};

export type OutboundContactSource = {
  email: string | null;
  name: string | null;
  title: string | null;
  sourceUrl: string | null;
  context: string | null;
};

export type OutboundDraftSource = {
  contactEmail: string | null;
  subject: string | null;
  fullEmail: string | null;
};

export type OutboundRun = {
  id: string;
  domain: string;
  status: LeadgenRunStatus;
  reasoningEffort: LeadgenReasoningEffort;
  leadCount: number;
  contactCount: number;
  draftCount: number;
  summary: string | null;
  latestMessage: string | null;
  errorMessage: string | null;
  pollAfterSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type OutboundLeadSummary = {
  id: string;
  businessDomain: string;
  buyerSummary: string | null;
  contactCount: number;
  draftCount: number;
};

export type OutboundLeadDetail = OutboundLeadSummary & {
  rationale: string | null;
  content: string | null;
  contacts: OutboundContactSource[];
  drafts: OutboundDraftSource[];
};

export function serializeOutboundRun({
  run,
  latestMessage,
}: {
  run: OutboundRunSource;
  latestMessage?: string | null;
}): OutboundRun {
  return {
    id: run.id,
    domain: run.domain,
    status: run.status,
    reasoningEffort: run.reasoningEffort,
    leadCount: run.leadCount,
    contactCount: run.contactCount,
    draftCount: run.draftCount,
    summary: normalizeText(run.summary),
    latestMessage: normalizeText(latestMessage ?? null),
    errorMessage: normalizeText(run.errorMessage),
    pollAfterSeconds: isActiveOutboundRunStatus(run.status) ? 2 : null,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
  };
}

export function serializeOutboundLeadSummary({
  lead,
  contactCount,
  draftCount,
}: {
  lead: OutboundLeadSource;
  contactCount: number;
  draftCount: number;
}): OutboundLeadSummary {
  return {
    id: lead.id,
    businessDomain: lead.businessDomain,
    buyerSummary: buildBuyerSummary(lead),
    contactCount,
    draftCount,
  };
}

export function serializeOutboundLeadDetail({
  lead,
  contacts,
  drafts,
}: {
  lead: OutboundLeadSource;
  contacts: OutboundContactSource[];
  drafts: OutboundDraftSource[];
}): OutboundLeadDetail {
  return {
    ...serializeOutboundLeadSummary({
      lead,
      contactCount: contacts.length,
      draftCount: drafts.length,
    }),
    rationale: normalizeText(lead.rationale),
    content: normalizeText(lead.content),
    contacts: contacts.map((contact) => ({
      email: normalizeText(contact.email),
      name: normalizeText(contact.name),
      title: normalizeText(contact.title),
      sourceUrl: normalizeText(contact.sourceUrl),
      context: normalizeText(contact.context),
    })),
    drafts: drafts.map((draft) => ({
      contactEmail: normalizeText(draft.contactEmail),
      subject: normalizeText(draft.subject),
      fullEmail: normalizeText(draft.fullEmail),
    })),
  };
}

export function isActiveOutboundRunStatus(status: LeadgenRunStatus): boolean {
  return status === 'QUEUED' || status === 'RUNNING';
}

function buildBuyerSummary(lead: OutboundLeadSource): string | null {
  const rationale = normalizeText(lead.rationale);

  if (rationale) {
    return rationale;
  }

  const content = normalizeText(lead.content);
  if (!content) {
    return null;
  }

  return content.length > 280 ? `${content.slice(0, 277).trim()}...` : content;
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}
