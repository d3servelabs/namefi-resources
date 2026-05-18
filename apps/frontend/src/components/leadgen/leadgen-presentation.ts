import type { AppRouterOutput } from '@/lib/trpc';

export type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
export type LeadgenLead = LeadgenSnapshot['leads'][number];

export type LeadPresentationGroup = 'top' | 'secondary' | 'checking';
export type LeadPresentationAction =
  | 'ready_to_contact'
  | 'finding_contact'
  | 'backup'
  | 'checking';

export type LeadPresentation = {
  lead: LeadgenLead;
  group: LeadPresentationGroup;
  action: LeadPresentationAction;
  buyerSummary: string;
};

export type LeadPresentationCounts = Record<
  'top' | 'secondary' | 'checking' | 'contacts',
  number
>;

export type LeadPresentationModel = {
  leads: LeadPresentation[];
  groups: Record<LeadPresentationGroup, LeadPresentation[]>;
  counts: LeadPresentationCounts;
};

const whitespaceRe = /\s+/g;
const sentenceBoundaryRe = /^(.{1,220}?[.!?])(?:\s|$)/;

export function buildLeadPresentationModel(
  run: LeadgenSnapshot,
): LeadPresentationModel {
  const groups: Record<LeadPresentationGroup, LeadPresentation[]> = {
    top: [],
    secondary: [],
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
      top: groups.top.length,
      secondary: groups.secondary.length,
      checking: groups.checking.length,
      contacts: run.contactCount,
    },
  };
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
  return lead.status === 'contact_now' ? 'top' : 'secondary';
}

function getPresentationAction(lead: LeadgenLead): LeadPresentationAction {
  if (lead.status === 'checking') return 'checking';
  if (lead.status !== 'contact_now') return 'backup';
  return lead.contacts.length > 0 ||
    lead.contactReadiness === 'contact_found' ||
    lead.contactReadiness === 'generic_fallback'
    ? 'ready_to_contact'
    : 'finding_contact';
}

function getBuyerSummary(lead: LeadgenLead) {
  if (lead.status === 'checking') return 'Checking buyer fit.';

  return (
    cleanSummary(lead.thesis, 180) ??
    cleanSummary(lead.rationale, 180) ??
    cleanSummary(lead.content, 180) ??
    'Potential buyer fit found.'
  );
}

function cleanSummary(value: string | null | undefined, maxLength: number) {
  const normalized = value?.replace(whitespaceRe, ' ').trim();
  if (!normalized) return null;

  const sentence =
    sentenceBoundaryRe.exec(normalized)?.[1]?.trim() ?? normalized;
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, Math.max(0, maxLength - 1)).trimEnd()}.`;
}
