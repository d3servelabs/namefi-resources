import type { LeadgenUserSignalState } from '@namefi-astra/common/contract/leadgen-contract';
import { arrayMove } from '@dnd-kit/sortable';

export type LeadOrganizationSectionId = 'bookmarked' | 'prospects' | 'hidden';

export type LeadSectionLeadIds = Record<LeadOrganizationSectionId, string[]>;

export const leadOrganizationSectionIds = [
  'bookmarked',
  'prospects',
  'hidden',
] as const satisfies readonly LeadOrganizationSectionId[];

export function getSectionLeadIds<T extends { lead: { id: string } }>(
  sectionLeads: Record<LeadOrganizationSectionId, T[]>,
): LeadSectionLeadIds {
  return {
    bookmarked: sectionLeads.bookmarked.map(({ lead }) => lead.id),
    prospects: sectionLeads.prospects.map(({ lead }) => lead.id),
    hidden: sectionLeads.hidden.map(({ lead }) => lead.id),
  };
}

export function getLeadSectionIdByLeadId(sectionLeadIds: LeadSectionLeadIds) {
  const sectionIdByLeadId = new Map<string, LeadOrganizationSectionId>();

  for (const sectionId of leadOrganizationSectionIds) {
    for (const leadId of sectionLeadIds[sectionId]) {
      sectionIdByLeadId.set(leadId, sectionId);
    }
  }

  return sectionIdByLeadId;
}

export function getDropTargetSectionId({
  overId,
  leadSectionIdByLeadId,
}: {
  overId: string;
  leadSectionIdByLeadId: Map<string, LeadOrganizationSectionId>;
}): LeadOrganizationSectionId | null {
  if (isLeadOrganizationSectionId(overId)) return overId;
  return leadSectionIdByLeadId.get(overId) ?? null;
}

export function moveLeadInSections({
  activeLeadId,
  overId,
  sourceSectionId,
  targetSectionId,
  sectionLeadIds,
  insertIndex,
}: {
  activeLeadId: string;
  overId: string;
  sourceSectionId: LeadOrganizationSectionId;
  targetSectionId: LeadOrganizationSectionId;
  sectionLeadIds: LeadSectionLeadIds;
  insertIndex?: number;
}): LeadSectionLeadIds {
  if (sourceSectionId === targetSectionId) {
    const sourceLeadIds = sectionLeadIds[sourceSectionId];
    const oldIndex = sourceLeadIds.indexOf(activeLeadId);
    const overIndex = sourceLeadIds.indexOf(overId);

    if (oldIndex === -1) return sectionLeadIds;

    return {
      ...sectionLeadIds,
      [sourceSectionId]:
        overIndex === -1
          ? moveLeadIdToEnd(sourceLeadIds, activeLeadId)
          : arrayMove(sourceLeadIds, oldIndex, overIndex),
    };
  }

  const nextSectionLeadIds = removeLeadFromSections(
    activeLeadId,
    sectionLeadIds,
  );
  const targetLeadIds = nextSectionLeadIds[targetSectionId];
  const overIndex = targetLeadIds.indexOf(overId);
  const nextInsertIndex = clampLeadInsertIndex(
    insertIndex ?? (overIndex === -1 ? targetLeadIds.length : overIndex),
    targetLeadIds.length,
  );

  nextSectionLeadIds[targetSectionId] = [
    ...targetLeadIds.slice(0, nextInsertIndex),
    activeLeadId,
    ...targetLeadIds.slice(nextInsertIndex),
  ];

  return nextSectionLeadIds;
}

export function moveLeadToSectionEnd({
  leadId,
  sectionLeadIds,
  targetSectionId,
}: {
  leadId: string;
  sectionLeadIds: LeadSectionLeadIds;
  targetSectionId: LeadOrganizationSectionId;
}): LeadSectionLeadIds {
  const nextSectionLeadIds = removeLeadFromSections(leadId, sectionLeadIds);

  nextSectionLeadIds[targetSectionId] = [
    ...nextSectionLeadIds[targetSectionId],
    leadId,
  ];

  return nextSectionLeadIds;
}

export function flattenSectionLeadIds(sectionLeadIds: LeadSectionLeadIds) {
  return leadOrganizationSectionIds.flatMap(
    (sectionId) => sectionLeadIds[sectionId],
  );
}

export function getSectionUserSignalState(
  sectionId: LeadOrganizationSectionId,
): LeadgenUserSignalState {
  if (sectionId === 'bookmarked') return 'bookmarked';
  if (sectionId === 'hidden') return 'hidden';
  return 'none';
}

export function areLeadIdsEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((leadId, index) => leadId === right[index])
  );
}

function isLeadOrganizationSectionId(
  value: string,
): value is LeadOrganizationSectionId {
  return leadOrganizationSectionIds.includes(
    value as LeadOrganizationSectionId,
  );
}

function removeLeadFromSections(
  leadId: string,
  sectionLeadIds: LeadSectionLeadIds,
): LeadSectionLeadIds {
  return {
    bookmarked: sectionLeadIds.bookmarked.filter(
      (currentLeadId) => currentLeadId !== leadId,
    ),
    prospects: sectionLeadIds.prospects.filter(
      (currentLeadId) => currentLeadId !== leadId,
    ),
    hidden: sectionLeadIds.hidden.filter(
      (currentLeadId) => currentLeadId !== leadId,
    ),
  };
}

function moveLeadIdToEnd(leadIds: string[], leadId: string) {
  return [
    ...leadIds.filter((currentLeadId) => currentLeadId !== leadId),
    leadId,
  ];
}

function clampLeadInsertIndex(index: number, length: number) {
  return Math.max(0, Math.min(index, length));
}
