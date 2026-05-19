import { describe, expect, it } from 'vitest';
import {
  actionToTrackingStatus,
  appendExportTrackingStatusHistory,
  canApproveExportTrackingStatus,
  canResolveExportTrackingStatus,
  getExportTrackingEmailType,
  isAdminApprovedForPendingNotification,
  isBurnEligibleExportStatus,
  isTerminalStatus,
  mapDecisionToPersistedStatus,
} from './export-tracking-state';

describe('export-tracking-state', () => {
  describe('mapDecisionToPersistedStatus', () => {
    it('routes TRANSFER_COMPLETED decisions through the admin gate', () => {
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

    it('persists TRANSFER_FAILED as a terminal failure', () => {
      expect(mapDecisionToPersistedStatus('TRANSFER_FAILED')).toBe(
        'TRANSFER_FAILED',
      );
    });
  });

  describe('actionToTrackingStatus', () => {
    it('maps no-signal and undetermined actions directly', () => {
      expect(actionToTrackingStatus('NO_SIGNAL')).toBe('NO_SIGNAL');
      expect(actionToTrackingStatus('UNDETERMINED')).toBe('UNDETERMINED');
    });

    it('preserves TRANSFER_COMPLETED action mapping', () => {
      expect(actionToTrackingStatus('TRANSFER_COMPLETED')).toBe(
        'TRANSFER_COMPLETED',
      );
    });
  });

  describe('isTerminalStatus', () => {
    it('returns true for terminal statuses', () => {
      expect(isTerminalStatus('TRANSFER_COMPLETED')).toBe(true);
      expect(isTerminalStatus('TRANSFER_FAILED')).toBe(true);
      expect(isTerminalStatus('RESOLVED')).toBe(true);
    });

    it('returns false for active and transient statuses', () => {
      expect(isTerminalStatus('PENDING_TRANSFER')).toBe(false);
      expect(isTerminalStatus('TRANSFER_PERIOD')).toBe(false);
      expect(isTerminalStatus('NEEDS_ADMIN_REVIEW')).toBe(false);
      expect(isTerminalStatus('NO_SIGNAL')).toBe(false);
      expect(isTerminalStatus('UNDETERMINED')).toBe(false);
    });
  });

  describe('admin review gating', () => {
    it('allows approval only for NEEDS_ADMIN_REVIEW', () => {
      expect(canApproveExportTrackingStatus('NEEDS_ADMIN_REVIEW')).toBe(true);
    });

    it('rejects approval for terminal and active non-review states', () => {
      expect(canApproveExportTrackingStatus('PENDING_TRANSFER')).toBe(false);
      expect(canApproveExportTrackingStatus('TRANSFER_COMPLETED')).toBe(false);
      expect(canApproveExportTrackingStatus('RESOLVED')).toBe(false);
    });

    it('allows resolve only for NEEDS_ADMIN_REVIEW', () => {
      expect(canResolveExportTrackingStatus('NEEDS_ADMIN_REVIEW')).toBe(true);
    });

    it('rejects resolve for terminal rows and non-review active states', () => {
      expect(canResolveExportTrackingStatus('PENDING_TRANSFER')).toBe(false);
      expect(canResolveExportTrackingStatus('TRANSFER_COMPLETED')).toBe(false);
      expect(canResolveExportTrackingStatus('RESOLVED')).toBe(false);
    });
  });

  describe('burn eligibility', () => {
    it('allows burn for export-complete states', () => {
      expect(isBurnEligibleExportStatus('TRANSFER_COMPLETED')).toBe(true);
      expect(isBurnEligibleExportStatus('NEEDS_ADMIN_REVIEW')).toBe(true);
    });

    it('rejects burn for unresolved, pending, and resolved states', () => {
      expect(isBurnEligibleExportStatus('PENDING_TRANSFER')).toBe(false);
      expect(isBurnEligibleExportStatus('RESOLVED')).toBe(false);
      expect(isBurnEligibleExportStatus('TRANSFER_FAILED')).toBe(false);
    });
  });

  describe('email type routing', () => {
    it('uses pending email type for transfer-in-progress statuses', () => {
      expect(getExportTrackingEmailType('PENDING_TRANSFER')).toBe('pending');
      expect(getExportTrackingEmailType('TRANSFER_PERIOD')).toBe('pending');
    });

    it('uses complete email type for export-complete statuses', () => {
      expect(getExportTrackingEmailType('NEEDS_ADMIN_REVIEW')).toBe('complete');
      expect(getExportTrackingEmailType('TRANSFER_COMPLETED')).toBe('complete');
    });

    it('uses failed email type for TRANSFER_FAILED', () => {
      expect(getExportTrackingEmailType('TRANSFER_FAILED')).toBe('failed');
    });

    it('returns null for statuses without an applicable email template', () => {
      expect(getExportTrackingEmailType('NO_SIGNAL')).toBeNull();
      expect(getExportTrackingEmailType('UNDETERMINED')).toBeNull();
      expect(getExportTrackingEmailType('RESOLVED')).toBeNull();
    });
  });

  describe('admin-approved pending notification gate', () => {
    it('is true when client approval exists', () => {
      expect(
        isAdminApprovedForPendingNotification({
          clientApprovedAt: new Date(),
          adminVerifiedAt: null,
        }),
      ).toBe(true);
    });

    it('is true when admin verification exists', () => {
      expect(
        isAdminApprovedForPendingNotification({
          clientApprovedAt: null,
          adminVerifiedAt: new Date(),
        }),
      ).toBe(true);
    });

    it('is false when neither approval signal exists', () => {
      expect(
        isAdminApprovedForPendingNotification({
          clientApprovedAt: null,
          adminVerifiedAt: null,
        }),
      ).toBe(false);
    });
  });

  describe('status history appending', () => {
    it('appends a status with an ISO timestamp to empty history', () => {
      const at = new Date('2026-02-23T10:00:00.000Z');
      const result = appendExportTrackingStatusHistory(
        undefined,
        'TRANSFER_COMPLETED',
        { now: at },
      );

      expect(result).toEqual([
        {
          timestamp: '2026-02-23T10:00:00.000Z',
          status: 'TRANSFER_COMPLETED',
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
        { now: at },
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

    it('persists reason and evidence when provided', () => {
      const at = new Date('2026-02-23T12:00:00.000Z');
      const result = appendExportTrackingStatusHistory([], 'PENDING_TRANSFER', {
        now: at,
        reason: 'Direct registrar reports pending transfer',
        evidence: {
          actor: 'workflow',
          decisionAction: 'PENDING_TRANSFER',
          decisionReason: 'Direct registrar reports pending transfer',
          sources: [
            {
              source: 'DirectRegistrar',
              status: 'positive_pending',
              checkedAt: '2026-02-23T12:00:00.000Z',
            },
          ],
        },
        eppStatuses: ['pendingTransfer'],
      });

      expect(result).toEqual([
        {
          timestamp: '2026-02-23T12:00:00.000Z',
          status: 'PENDING_TRANSFER',
          eppStatuses: ['pendingTransfer'],
          reason: 'Direct registrar reports pending transfer',
          evidence: {
            actor: 'workflow',
            decisionAction: 'PENDING_TRANSFER',
            decisionReason: 'Direct registrar reports pending transfer',
            sources: [
              {
                source: 'DirectRegistrar',
                status: 'positive_pending',
                checkedAt: '2026-02-23T12:00:00.000Z',
              },
            ],
          },
        },
      ]);
    });
  });
});
