import type { AppRouterOutput } from '@/lib/trpc';

export type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
export type LeadgenLead = LeadgenSnapshot['leads'][number];

export type LeadPresentationGroup = 'ranked' | 'checking';
export type LeadPresentationAction =
  | 'ready_to_contact'
  | 'finding_contact'
  | 'ranked'
  | 'checking';

export type LeadPresentation = {
  lead: LeadgenLead;
  group: LeadPresentationGroup;
  action: LeadPresentationAction;
  buyerSummary: string;
};

export type LeadPresentationCounts = Record<
  'prospects' | 'ranked' | 'checking' | 'contacts',
  number
>;

export type LeadPresentationModel = {
  leads: LeadPresentation[];
  groups: Record<LeadPresentationGroup, LeadPresentation[]>;
  counts: LeadPresentationCounts;
};

const whitespaceRe = /\s+/g;

export function buildLeadPresentationModel(
  run: LeadgenSnapshot,
): LeadPresentationModel {
  const groups: Record<LeadPresentationGroup, LeadPresentation[]> = {
    ranked: [],
    checking: [],
  };
  const leads = run.leads.map((lead) => buildLeadPresentation(lead));

  for (const lead of leads) {
    groups[lead.group].push(lead);
  }

  return {
    leads,
    groups,
    counts: {
      prospects: leads.length,
      ranked: groups.ranked.length,
      checking: groups.checking.length,
      contacts: run.contactCount,
    },
  };
}

export function canPrepareLeadgenOutreach({
  lead,
  runStatus,
}: {
  lead: LeadgenLead;
  runStatus: LeadgenSnapshot['status'];
}) {
  if (lead.status === 'suppressed') return false;
  if (lead.status === 'checking') return isTerminalLeadgenRunStatus(runStatus);
  return true;
}

export function buildLeadPresentation(lead: LeadgenLead): LeadPresentation {
  const group = getPresentationGroup(lead);
  const action = getPresentationAction(lead);

  return {
    lead,
    group,
    action,
    buyerSummary: getBuyerSummary(lead),
  };
}

function getPresentationGroup(lead: LeadgenLead): LeadPresentationGroup {
  if (lead.status === 'checking') return 'checking';
  return 'ranked';
}

function getPresentationAction(lead: LeadgenLead): LeadPresentationAction {
  if (lead.status === 'checking') return 'checking';
  if (lead.status !== 'contact_now') return 'ranked';
  return lead.contacts.length > 0 ||
    lead.contactReadiness === 'contact_found' ||
    lead.contactReadiness === 'generic_fallback'
    ? 'ready_to_contact'
    : 'finding_contact';
}

function getBuyerSummary(lead: LeadgenLead) {
  return cleanText(lead.rationale) ?? 'Potential buyer fit found.';
}

function isTerminalLeadgenRunStatus(status: LeadgenSnapshot['status']) {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';
}

function cleanText(value: string | null | undefined) {
  const normalized = value?.replace(whitespaceRe, ' ').trim();
  if (!normalized) return null;
  return normalized;
}
