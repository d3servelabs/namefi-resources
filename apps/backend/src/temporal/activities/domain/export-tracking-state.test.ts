import { describe, expect, it } from 'vitest';
import {
  actionToTrackingStatus,
  appendExportTrackingStatusHistory,
  canApproveExportTrackingStatus,
  canResolveExportTrackingStatus,
  isBurnEligibleExportStatus,
  mapDecisionToPersistedStatus,
} from './export-tracking-state';

describe('export-tracking-state', () => {
  describe('mapDecisionToPersistedStatus', () => {
    it('maps transfer completion to admin review state', () => {
      expect(mapDecisionToPersistedStatus('TRANSFER_COMPLETED')).toBe(
        'NEEDS_ADMIN_REVIEW',
      );
    });

    it('keeps pending transfer action as pending transfer status', () => {
      expect(mapDecisionToPersistedStatus('PENDING_TRANSFER')).toBe(
        'PENDING_TRANSFER',
      );
    });

    it('keeps transfer period action as transfer period status', () => {
      expect(mapDecisionToPersistedStatus('TRANSFER_PERIOD')).toBe(
        'TRANSFER_PERIOD',
      );
    });
  });

  describe('actionToTrackingStatus', () => {
    it('maps no-signal and undetermined actions directly', () => {
      expect(actionToTrackingStatus('NO_SIGNAL')).toBe('NO_SIGNAL');
      expect(actionToTrackingStatus('UNDETERMINED')).toBe('UNDETERMINED');
    });

    it('keeps transfer completed as transfer completed for compatibility', () => {
      expect(actionToTrackingStatus('TRANSFER_COMPLETED')).toBe(
        'TRANSFER_COMPLETED',
      );
    });
  });

  describe('admin review gating', () => {
    it('allows approval for needs-admin-review and legacy transfer-completed', () => {
      expect(canApproveExportTrackingStatus('NEEDS_ADMIN_REVIEW')).toBe(true);
      expect(canApproveExportTrackingStatus('TRANSFER_COMPLETED')).toBe(true);
    });

    it('rejects approval for non-review states', () => {
      expect(canApproveExportTrackingStatus('PENDING_TRANSFER')).toBe(false);
      expect(canApproveExportTrackingStatus('NOTIFIED')).toBe(false);
      expect(canApproveExportTrackingStatus('RESOLVED')).toBe(false);
    });

    it('allows resolve for review and notified states', () => {
      expect(canResolveExportTrackingStatus('NEEDS_ADMIN_REVIEW')).toBe(true);
      expect(canResolveExportTrackingStatus('NOTIFIED')).toBe(true);
      expect(canResolveExportTrackingStatus('TRANSFER_COMPLETED')).toBe(true);
    });

    it('rejects resolve for pending status', () => {
      expect(canResolveExportTrackingStatus('PENDING_TRANSFER')).toBe(false);
    });
  });

  describe('burn eligibility', () => {
    it('allows burn for export-complete states', () => {
      expect(isBurnEligibleExportStatus('TRANSFER_COMPLETED')).toBe(true);
      expect(isBurnEligibleExportStatus('NEEDS_ADMIN_REVIEW')).toBe(true);
      expect(isBurnEligibleExportStatus('NOTIFIED')).toBe(true);
    });

    it('rejects burn for unresolved and pending states', () => {
      expect(isBurnEligibleExportStatus('PENDING_TRANSFER')).toBe(false);
      expect(isBurnEligibleExportStatus('RESOLVED')).toBe(false);
    });
  });

  describe('status history appending', () => {
    it('appends a status with an ISO timestamp to empty history', () => {
      const at = new Date('2026-02-23T10:00:00.000Z');
      const result = appendExportTrackingStatusHistory(
        undefined,
        'NOTIFIED',
        at,
      );

      expect(result).toEqual([
        {
          timestamp: '2026-02-23T10:00:00.000Z',
          status: 'NOTIFIED',
        },
      ]);
    });

    it('preserves existing entries and appends to the end', () => {
      const at = new Date('2026-02-23T11:00:00.000Z');
      const result = appendExportTrackingStatusHistory(
        [
          {
            timestamp: '2026-02-23T09:00:00.000Z',
            status: 'NEEDS_ADMIN_REVIEW',
          },
        ],
        'RESOLVED',
        at,
      );

      expect(result).toEqual([
        {
          timestamp: '2026-02-23T09:00:00.000Z',
          status: 'NEEDS_ADMIN_REVIEW',
        },
        {
          timestamp: '2026-02-23T11:00:00.000Z',
          status: 'RESOLVED',
        },
      ]);
    });
  });
});
