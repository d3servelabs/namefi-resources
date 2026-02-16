import { describe, expect, it } from 'vitest';
import { EppStatuses, type ClientOrServerSharedStatus } from './epp-status';

describe('EppStatuses', () => {
  it('normalizes statuses and returns EPP/WHOIS + RDAP formats', () => {
    const statuses = EppStatuses.fromArray([
      'client transfer prohibited',
      'SERVER_UPDATE_PROHIBITED',
      'pendingTransfer',
      'OK',
    ]);

    expect(statuses.getEppStatuses()).toEqual([
      'clientTransferProhibited',
      'serverUpdateProhibited',
      'pendingTransfer',
      'ok',
    ]);
    expect(statuses.getWhoisStatuses()).toEqual([
      'clientTransferProhibited',
      'serverUpdateProhibited',
      'pendingTransfer',
      'ok',
    ]);
    expect(statuses.getRDAPStatuses()).toEqual([
      'client transfer prohibited',
      'server update prohibited',
      'pending transfer',
      'ok',
    ]);
  });

  it('returns the same values from getRdapStatuses and getRDAPStatuses', () => {
    const statuses = EppStatuses.fromArray([
      'clientTransferProhibited',
      'pendingTransfer',
    ]);

    expect(statuses.getRdapStatuses()).toEqual(statuses.getRDAPStatuses());
  });

  it('supports case/spacing-insensitive hasStatus checks', () => {
    const statuses = EppStatuses.fromArray(['clientTransferProhibited']);

    expect(statuses.hasStatus('client transfer prohibited')).toBe(true);
    expect(statuses.hasStatus('CLIENT_TRANSFER_PROHIBITED')).toBe(true);
    expect(statuses.hasStatus('server transfer prohibited')).toBe(false);
  });

  it('adds and removes statuses with setStatus', () => {
    const statuses = EppStatuses.fromArray();

    statuses.setStatus('server transfer prohibited');
    expect(statuses.hasStatus('serverTransferProhibited')).toBe(true);

    statuses.setStatus('serverTransferProhibited', false);
    expect(statuses.hasStatus('server transfer prohibited')).toBe(false);
  });

  it('returns false for unsupported shared client/server status inputs', () => {
    const statuses = EppStatuses.fromArray(['serverTransferProhibited']);

    expect(
      statuses.hasClientOrServerStatus(
        'pending transfer' as unknown as ClientOrServerSharedStatus,
      ),
    ).toBe(false);
  });

  it('checks shared client/server statuses from spaced and camel inputs', () => {
    const serverStatuses = EppStatuses.fromArray(['serverTransferProhibited']);
    expect(serverStatuses.hasClientOrServerStatus('transfer prohibited')).toBe(
      true,
    );
    expect(serverStatuses.hasClientOrServerStatus('transferProhibited')).toBe(
      true,
    );

    const clientStatuses = EppStatuses.fromArray(['clientHold']);
    expect(clientStatuses.hasClientOrServerStatus('hold')).toBe(true);

    const unrelatedStatuses = EppStatuses.fromArray(['pendingTransfer']);
    expect(
      unrelatedStatuses.hasClientOrServerStatus('transfer prohibited'),
    ).toBe(false);
  });

  it('is type-safe for shared client/server status inputs', () => {
    const spaced: ClientOrServerSharedStatus = 'transfer prohibited';
    const camel: ClientOrServerSharedStatus = 'transferProhibited';

    expect(spaced).toBe('transfer prohibited');
    expect(camel).toBe('transferProhibited');
  });
});
