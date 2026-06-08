import type { AppRouterOutput } from '@/lib/trpc';
import type { LeadgenUserSignalState } from '@namefi-astra/common/contract/leadgen-contract';

export type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
export type LeadgenLead = LeadgenSnapshot['leads'][number];

export type LeadPresentationGroup = 'ranked' | 'checking';
export type LeadOrganizationGroup = 'bookmarked' | 'prospects' | 'hidden';

export type LeadPresentation = {
  lead: LeadgenLead;
  group: LeadPresentationGroup;
  organizationState: LeadgenUserSignalState;
  buyerSummary: string;
};

export type LeadPresentationCounts = Record<
  | 'prospects'
  | 'ranked'
  | 'checking'
  | 'contacts'
  | 'bookmarked'
  | 'visibleProspects'
  | 'hidden',
  number
>;

export type LeadPresentationModel = {
  leads: LeadPresentation[];
  groups: Record<LeadPresentationGroup, LeadPresentation[]>;
  organizationGroups: Record<LeadOrganizationGroup, LeadPresentation[]>;
  counts: LeadPresentationCounts;
};

export type BuildLeadPresentationModelOptions = {
  userSignalStateByLeadId?: Partial<Record<string, LeadgenUserSignalState>>;
};

const whitespaceRe = /\s+/g;

export function buildLeadPresentationModel(
  run: LeadgenSnapshot,
  options: BuildLeadPresentationModelOptions = {},
): LeadPresentationModel {
  const groups: Record<LeadPresentationGroup, LeadPresentation[]> = {
    ranked: [],
    checking: [],
  };
  const organizationGroups: Record<LeadOrganizationGroup, LeadPresentation[]> =
    {
      bookmarked: [],
      prospects: [],
      hidden: [],
    };
  const leads = run.leads.map((lead) =>
    buildLeadPresentation(lead, {
      userSignalState: options.userSignalStateByLeadId?.[lead.id],
    }),
  );

  for (const lead of leads) {
    groups[lead.group].push(lead);
    organizationGroups[getOrganizationGroup(lead.organizationState)].push(lead);
  }

  return {
    leads,
    groups,
    organizationGroups,
    counts: {
      prospects: leads.length,
      ranked: groups.ranked.length,
      checking: groups.checking.length,
      contacts: run.contactCount,
      bookmarked: organizationGroups.bookmarked.length,
      visibleProspects: organizationGroups.prospects.length,
      hidden: organizationGroups.hidden.length,
    },
  };
}

export function buildLeadPresentation(
  lead: LeadgenLead,
  options: { userSignalState?: LeadgenUserSignalState } = {},
): LeadPresentation {
  const group = getPresentationGroup(lead);

  return {
    lead,
    group,
    organizationState: options.userSignalState ?? lead.organizationState,
    buyerSummary: getBuyerSummary(lead),
  };
}

function getPresentationGroup(lead: LeadgenLead): LeadPresentationGroup {
  return lead.rankingState;
}

function getOrganizationGroup(
  state: LeadgenUserSignalState,
): LeadOrganizationGroup {
  if (state === 'bookmarked') return 'bookmarked';
  if (state === 'hidden') return 'hidden';
  return 'prospects';
}

function getBuyerSummary(lead: LeadgenLead) {
  return cleanText(lead.rationale) ?? 'Potential buyer fit found.';
}

export function isTerminalLeadgenStatus(status: LeadgenSnapshot['status']) {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';
}

function cleanText(value: string | null | undefined) {
  const normalized = value?.replace(whitespaceRe, ' ').trim();
  if (!normalized) return null;
  return normalized;
}
