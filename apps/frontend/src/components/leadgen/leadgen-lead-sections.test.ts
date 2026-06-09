import { describe, expect, it } from 'vitest';

import {
  flattenSectionLeadIds,
  moveLeadInSections,
  moveLeadToSectionEnd,
  type LeadSectionLeadIds,
} from './leadgen-lead-sections';

const sectionLeadIds = {
  bookmarked: ['bookmarked-1'],
  prospects: ['prospect-1', 'prospect-2', 'prospect-3'],
  hidden: ['hidden-1'],
} satisfies LeadSectionLeadIds;

describe('lead section ordering', () => {
  it('moves leads within a bucket', () => {
    expect(
      moveLeadInSections({
        activeLeadId: 'prospect-3',
        overId: 'prospect-1',
        sourceSectionId: 'prospects',
        targetSectionId: 'prospects',
        sectionLeadIds,
      }).prospects,
    ).toEqual(['prospect-3', 'prospect-1', 'prospect-2']);
  });

  it('inserts cross-bucket drags before the hovered lead', () => {
    const nextSectionLeadIds = moveLeadInSections({
      activeLeadId: 'prospect-2',
      overId: 'hidden-1',
      sourceSectionId: 'prospects',
      targetSectionId: 'hidden',
      sectionLeadIds,
    });

    expect(nextSectionLeadIds.prospects).toEqual(['prospect-1', 'prospect-3']);
    expect(nextSectionLeadIds.hidden).toEqual(['prospect-2', 'hidden-1']);
  });

  it('honors explicit cross-bucket insertion indexes', () => {
    const nextSectionLeadIds = moveLeadInSections({
      activeLeadId: 'prospect-2',
      insertIndex: 1,
      overId: 'hidden-1',
      sourceSectionId: 'prospects',
      targetSectionId: 'hidden',
      sectionLeadIds,
    });

    expect(nextSectionLeadIds.hidden).toEqual(['hidden-1', 'prospect-2']);
  });

  it('appends bookmark and hide button moves to the destination bucket', () => {
    expect(
      moveLeadToSectionEnd({
        leadId: 'prospect-2',
        sectionLeadIds,
        targetSectionId: 'bookmarked',
      }),
    ).toMatchObject({
      bookmarked: ['bookmarked-1', 'prospect-2'],
      prospects: ['prospect-1', 'prospect-3'],
      hidden: ['hidden-1'],
    });

    expect(
      moveLeadToSectionEnd({
        leadId: 'prospect-2',
        sectionLeadIds,
        targetSectionId: 'hidden',
      }),
    ).toMatchObject({
      bookmarked: ['bookmarked-1'],
      prospects: ['prospect-1', 'prospect-3'],
      hidden: ['hidden-1', 'prospect-2'],
    });
  });

  it('flattens sections in the persisted bucket order', () => {
    expect(flattenSectionLeadIds(sectionLeadIds)).toEqual([
      'bookmarked-1',
      'prospect-1',
      'prospect-2',
      'prospect-3',
      'hidden-1',
    ]);
  });
});
