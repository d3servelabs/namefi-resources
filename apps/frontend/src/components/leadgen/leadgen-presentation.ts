import type { AppRouterOutput } from '@/lib/trpc';
import {
  leadgenUserSignalTypeByState,
  type LeadgenUserSignalState,
} from '@namefi-astra/common/contract/leadgen-contract';

export type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
export type LeadgenLead = LeadgenSnapshot['leads'][number];

export type LeadPresentationGroup = 'ranked' | 'checking';
export type LeadOrganizationGroup = 'bookmarked' | 'prospects' | 'hidden';
export type LeadPresentationAction =
  | 'ready_to_contact'
  | 'finding_contact'
  | 'ranked'
  | 'checking';

export type LeadPresentation = {
  lead: LeadgenLead;
  group: LeadPresentationGroup;
  organizationState: LeadgenUserSignalState;
  action: LeadPresentationAction;
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
const userSignalStateBySignalType = new Map<string, LeadgenUserSignalState>(
  Object.entries(leadgenUserSignalTypeByState).map(([state, signalType]) => [
    signalType,
    state as LeadgenUserSignalState,
  ]),
);

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

/**
 * Manual outreach is intentionally available for any prospect status. Keep the
 * lead/runStatus predicate shape so call sites stay stable if gating returns.
 */
export function canPrepareLeadgenOutreach(_params: {
  lead: LeadgenLead;
  runStatus: LeadgenSnapshot['status'];
}) {
  return true;
}

export function buildLeadPresentation(
  lead: LeadgenLead,
  options: { userSignalState?: LeadgenUserSignalState } = {},
): LeadPresentation {
  const group = getPresentationGroup(lead);
  const action = getPresentationAction(lead);

  return {
    lead,
    group,
    organizationState: options.userSignalState ?? getLeadUserSignalState(lead),
    action,
    buyerSummary: getBuyerSummary(lead),
  };
}

export function getLeadUserSignalState(
  lead: LeadgenLead,
): LeadgenUserSignalState {
  let latestUserSignal: {
    state: LeadgenUserSignalState;
    timestamp: number;
  } | null = null;

  for (const signal of lead.signals) {
    const state = userSignalStateBySignalType.get(signal.signalType);
    if (!state) continue;

    const timestamp = signal.updatedAt.getTime();
    if (!latestUserSignal || timestamp >= latestUserSignal.timestamp) {
      latestUserSignal = { state, timestamp };
    }
  }

  return latestUserSignal?.state ?? 'none';
}

function getPresentationGroup(lead: LeadgenLead): LeadPresentationGroup {
  if (lead.status === 'checking') return 'checking';
  return 'ranked';
}

function getOrganizationGroup(
  state: LeadgenUserSignalState,
): LeadOrganizationGroup {
  if (state === 'bookmarked') return 'bookmarked';
  if (state === 'hidden') return 'hidden';
  return 'prospects';
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

export function isTerminalLeadgenStatus(status: LeadgenSnapshot['status']) {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';
}

function cleanText(value: string | null | undefined) {
  const normalized = value?.replace(whitespaceRe, ' ').trim();
  if (!normalized) return null;
  return normalized;
}
